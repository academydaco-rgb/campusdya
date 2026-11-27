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

_DIR = Path(settings.LOBO_LESSONS_DIR)
# Caché por worker revalidado por el mtime del .chunks.json en disco (volumen
# compartido entre workers). Clave: diploma -> (mtime, chunks, emb). Si el archivo
# cambió (subida hecha por OTRO worker) o apareció por primera vez, se recarga desde
# disco. Evita que un worker siga sirviendo un caché vacío tras una subida.
_cache: dict[str, tuple[float, list, "np.ndarray | None"]] = {}


def _load(diploma: str):
    """Carga el índice por-lección de un diplomado, revalidando contra el disco."""
    cj = _DIR / f"{diploma}.chunks.json"
    ce = _DIR / f"{diploma}.npy"
    try:
        mtime = cj.stat().st_mtime if cj.exists() else 0.0
    except OSError:
        mtime = 0.0
    cached = _cache.get(diploma)
    if cached is not None and cached[0] == mtime:
        return cached[1], cached[2]
    if mtime and ce.exists():
        chunks = json.loads(cj.read_text(encoding="utf-8"))
        emb = np.load(ce)
    else:
        chunks, emb = [], None
    _cache[diploma] = (mtime, chunks, emb)
    return chunks, emb


def reload_cache():
    _cache.clear()


def has_lesson_content(diploma: str, lesson_id: str) -> bool:
    chunks, _ = _load(diploma)
    return any(str(c.get("lesson_id")) == str(lesson_id) for c in chunks)


def content_lesson_ids(diploma: str) -> set:
    """IDs de lecciones que ya tienen transcripción cargada en este diplomado."""
    chunks, _ = _load(diploma)
    return {str(c.get("lesson_id")) for c in chunks}


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
        if query and not base._is_trivial(query):
            try:
                qvec = await base._embed_query(client, query)
                idx_lesson = [i for i, c in enumerate(chunks) if str(c.get("lesson_id")) == str(lesson_id)]
                picked = []
                if idx_lesson and emb is not None:
                    sub = emb[idx_lesson]
                    order = np.argsort(-(sub @ qvec))[:4]
                    picked = [chunks[idx_lesson[int(j)]] for j in order]
                if picked:
                    material = "\n\n".join(f"[{c.get('lesson_title', lesson_title)}] {c['text']}" for c in picked)
                else:
                    gidx = np.argsort(-(base._EMB @ qvec))[:4]
                    material = "\n\n".join(
                        f"[{base._CHUNKS[int(i)]['source']}] {base._CHUNKS[int(i)]['text']}" for i in gidx
                    )
                    scope_note = (
                        "Nota: aún no está cargada la transcripción específica de esta clase; responde con el material "
                        "general del diplomado y, si la duda es muy puntual de esta clase, acláralo con amabilidad."
                    )
            except Exception:
                material = ""

        # Prompt del sistema FIJO (caché de Gemini); lo dinámico va en el turno del usuario.
        contents = []
        for h in (history or [])[-6:]:
            role = "model" if h.get("role") == "model" else "user"
            txt = (h.get("text") or "").strip()
            if txt:
                contents.append({"role": role, "parts": [{"text": txt}]})

        preamble = ""
        if scope_note:
            preamble += scope_note + "\n\n"
        if material:
            preamble += "Material de apoyo de esta clase (úsalo para responder con precisión; no inventes):\n" + material
        parts = []
        if preamble:
            parts.append({"text": preamble})
        if message:
            parts.append({"text": message})
        if image and image.get("data"):
            parts.append({"inlineData": {"mimeType": image.get("mime", "image/png"), "data": image["data"]}})
        if not parts:
            parts = [{"text": "(sin texto)"}]
        contents.append({"role": "user", "parts": parts})

        body = {
            "systemInstruction": {"parts": [{"text": _system(lesson_title)}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 1024},
        }
        d = await base._generate(client, body)
        cand = (d.get("candidates") or [{}])[0]
        out = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", [])).strip()
        return out or "Uy, no pude generar la respuesta ahora. Intenta de nuevo en unos segundos. 🐺"
