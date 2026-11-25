"""Tutor IA por lección.

Responde dudas de UNA clase concreta. Si esa clase ya tiene su transcripción
cargada, recupera fragmentos de ESA clase; si todavía no, responde con el
material general del diplomado (así el chat aparece y funciona en TODAS las
lecciones desde el inicio, haya o no transcripción subida).

Reutiliza el motor de embeddings/Gemini del servicio `lobo`.
"""
import json
from pathlib import Path

import numpy as np
import httpx

from app.core.config import settings
from app.services import lobo as base

_DIR = Path(__file__).resolve().parent.parent / "lobo_data" / "lessons"
_cache: dict[str, tuple[list, "np.ndarray | None"]] = {}


def _load(diploma: str):
    """Carga (y cachea) el índice por-lección de un diplomado, si existe."""
    if diploma in _cache:
        return _cache[diploma]
    cj = _DIR / f"{diploma}.chunks.json"
    ce = _DIR / f"{diploma}.npy"
    if cj.exists() and ce.exists():
        chunks = json.loads(cj.read_text(encoding="utf-8"))
        emb = np.load(ce)
    else:
        chunks, emb = [], None
    _cache[diploma] = (chunks, emb)
    return chunks, emb


def reload_cache():
    _cache.clear()


def has_lesson_content(diploma: str, lesson_id: str) -> bool:
    chunks, _ = _load(diploma)
    return any(str(c.get("lesson_id")) == str(lesson_id) for c in chunks)


def _system(lesson_title: str) -> str:
    return (
        "Eres LOBO, el tutor de IA de Academy D&A dentro de una clase del diplomado. "
        f"Estás ayudando con la clase: «{lesson_title}». "
        "Respondes dudas del alumno sobre ESTA clase, en español, claro y motivador, con el mismo tono cercano de Academy D&A. "
        "Usa SOLO el material de apoyo que se te entrega; no inventes datos, cifras ni pasos que no estén ahí. "
        "Si la duda se sale de esta clase, respóndela brevemente con lo que sepas del diplomado y sugiere la lección donde se ve a fondo. "
        "Sé conciso: ve al punto, usa listas cortas cuando ayude y remata con un siguiente paso accionable."
    )


async def answer(diploma: str, lesson_id: str, lesson_title: str, history, message, image=None):
    chunks, emb = _load(diploma)
    material, scope_note = "", ""

    async with httpx.AsyncClient(timeout=120) as client:
        query = (message or "").strip()
        if query:
            try:
                qvec = await base._embed_query(client, query)
                idx_lesson = [i for i, c in enumerate(chunks) if str(c.get("lesson_id")) == str(lesson_id)]
                picked = []
                if idx_lesson and emb is not None:
                    sub = emb[idx_lesson]
                    order = np.argsort(-(sub @ qvec))[:6]
                    picked = [chunks[idx_lesson[int(j)]] for j in order]
                if picked:
                    material = "\n\n".join(f"[{c.get('lesson_title', lesson_title)}] {c['text']}" for c in picked)
                else:
                    # Sin transcripción de esta clase -> apóyate en el material general del diplomado
                    gidx = np.argsort(-(base._EMB @ qvec))[:6]
                    material = "\n\n".join(
                        f"[{base._CHUNKS[int(i)]['source']}] {base._CHUNKS[int(i)]['text']}" for i in gidx
                    )
                    scope_note = (
                        "NOTA INTERNA: todavía no está cargada la transcripción específica de esta clase. "
                        "Responde con el material general del diplomado y, si la duda es muy puntual de esta clase, "
                        "acláralo con amabilidad (ej.: «de esta clase en concreto aún estoy afinando el detalle»)."
                    )
            except Exception:
                material = ""

        sys = _system(lesson_title)
        if scope_note:
            sys += "\n\n" + scope_note
        if material:
            sys += "\n\n## MATERIAL DE APOYO (úsalo para responder con precisión; no inventes)\n" + material

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
            parts.append({"inlineData": {"mimeType": image.get("mime", "image/png"), "data": image["data"]}})
        if not parts:
            parts = [{"text": "(sin texto)"}]
        contents.append({"role": "user", "parts": parts})

        body = {
            "systemInstruction": {"parts": [{"text": sys}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 1200},
        }
        r = await client.post(
            f"{base._BASE}/models/{settings.LOBO_GEN_MODEL}:generateContent",
            headers=base._headers(), json=body,
        )
        r.raise_for_status()
        d = r.json()
        cand = (d.get("candidates") or [{}])[0]
        out = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", [])).strip()
        return out or "Uy, no pude generar la respuesta ahora. Intenta de nuevo en unos segundos. 🐺"
