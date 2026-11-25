"""LOBO ADS — servicio del asistente IA de Meta Ads.

Carga una vez (por worker) el prompt del sistema, los fragmentos del curso y
sus embeddings. En cada pregunta recupera los fragmentos más relevantes
(búsqueda semántica / RAG) y se los pasa a Gemini junto con el prompt, de
modo que el modelo responde con los datos reales del diplomado sin tener que
enviar todo el conocimiento en cada llamada (costo mínimo).
"""
import json
import asyncio
from pathlib import Path

import numpy as np
import httpx

from app.core.config import settings

_DIR = Path(__file__).resolve().parent.parent / "lobo_data"
_SYS = (_DIR / "system_prompt.txt").read_text(encoding="utf-8")
_CHUNKS = json.loads((_DIR / "chunks.json").read_text(encoding="utf-8"))
_EMB = np.load(_DIR / "embeddings.npy")  # (N, 768) ya normalizado

_BASE = "https://generativelanguage.googleapis.com/v1beta"
_DIMS = 768
_TOP_K = 6


def _headers():
    return {"x-goog-api-key": settings.GEMINI_API_KEY, "Content-Type": "application/json"}


async def _embed_query(client: httpx.AsyncClient, text: str) -> np.ndarray:
    r = await client.post(
        f"{_BASE}/{settings.LOBO_EMBED_MODEL}:embedContent",
        headers=_headers(),
        json={
            "model": settings.LOBO_EMBED_MODEL,
            "content": {"parts": [{"text": text}]},
            "outputDimensionality": _DIMS,
            "taskType": "RETRIEVAL_QUERY",
        },
    )
    r.raise_for_status()
    v = np.array(r.json()["embedding"]["values"], dtype=np.float32)
    return v / (np.linalg.norm(v) + 1e-9)


def _retrieve(qvec: np.ndarray, k: int = _TOP_K):
    sims = _EMB @ qvec
    idx = np.argsort(-sims)[:k]
    return [_CHUNKS[int(i)] for i in idx]

async def _generate(client: httpx.AsyncClient, body: dict, model: str | None = None) -> dict:
    """Llama a generateContent con reintentos ante 429/500/503 (saturación pasajera)."""
    model = model or settings.LOBO_GEN_MODEL
    url = f"{_BASE}/models/{model}:generateContent"
    last = None
    for attempt in range(4):
        r = await client.post(url, headers=_headers(), json=body)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (429, 500, 503):
            last = r
            await asyncio.sleep(1.5 * (attempt + 1))
            continue
        r.raise_for_status()
    if last is not None:
        last.raise_for_status()
    raise RuntimeError("generate failed")



async def answer(history, message, image=None):
    """Devuelve la respuesta de LOBO ADS.

    history: lista de {role: 'user'|'model', text: str}
    message: texto del alumno (str)
    image:   dict {mime, data(base64)} o None
    """
    async with httpx.AsyncClient(timeout=120) as client:
        # 1) Recuperar material relevante según el mensaje del alumno
        material = ""
        query = (message or "").strip()
        if query:
            try:
                qvec = await _embed_query(client, query)
                ctx = _retrieve(qvec)
                material = "\n\n".join(f"[{c['source']}] {c['text']}" for c in ctx)
            except Exception:
                material = ""  # si falla el buscador, Gemini responde igual con el prompt

        sys = _SYS
        if material:
            sys += (
                "\n\n## MATERIAL DE APOYO (fragmentos reales del curso de Academy D&A; "
                "úsalos para responder con precisión y NO inventes datos que no estén aquí)\n"
                + material
            )

        # 2) Construir la conversación
        contents = []
        for h in (history or [])[-12:]:
            role = "model" if h.get("role") == "model" else "user"
            txt = (h.get("text") or "").strip()
            if txt:
                contents.append({"role": role, "parts": [{"text": txt}]})

        parts = []
        if message:
            parts.append({"text": message})
        if image and image.get("data"):
            parts.append({
                "inlineData": {
                    "mimeType": image.get("mime", "image/png"),
                    "data": image["data"],
                }
            })
        if not parts:
            parts = [{"text": "(sin texto)"}]
        contents.append({"role": "user", "parts": parts})

        body = {
            "systemInstruction": {"parts": [{"text": sys}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 1400},
        }
        d = await _generate(client, body)
        cand = (d.get("candidates") or [{}])[0]
        out = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
        out = out.strip()
        if not out:
            out = "Uy, no pude generar la respuesta en este momento. Intenta de nuevo en unos segundos. 🐺"
        return out
