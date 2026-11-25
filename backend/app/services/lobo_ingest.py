"""Ingesta de transcripciones por diplomado (usada por el admin).

Recibe un archivo (PDF/Word/txt) con todas las clases de un diplomado — cada
clase precedida por su título, sea con marcador `###` o con su código `N.N`
(p. ej. «1.1 Título» o «8A.3 Título») — lo parte por clase, lo empareja con
las lecciones reales del diplomado (por código y, si no, por similitud de
título), genera embeddings con Gemini y guarda el índice que usa el tutor de
cada lección. Devuelve un reporte de qué clases se emparejaron y cuáles no.
"""
import io
import re
import unicodedata
from pathlib import Path

import numpy as np
import httpx

from app.core.config import settings
from app.services import lobo_lessons

_BASE = "https://generativelanguage.googleapis.com/v1beta"
_DIMS = 768


# ---------- extracción de texto ----------
def extract_text(filename: str, data: bytes) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    if ext in ("txt", "md") or (not ext):
        return data.decode("utf-8", errors="ignore")
    if ext == "docx":
        from docx import Document
        return "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
    if ext == "pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((pg.extract_text() or "") for pg in reader.pages)
    raise ValueError(f"Formato no soportado: .{ext} (usa PDF, Word o TXT)")


# ---------- utilidades de emparejamiento ----------
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


_CODE_RE = re.compile(r"^\s*(\d{1,2}[a-zA-Z]?\.\d{1,2})\b")
_HEADER_RE = re.compile(r"^\s*\d{1,2}[A-Za-z]?\.\d{1,2}\s+[A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]")


def _code_of(title: str):
    m = _CODE_RE.match(title or "")
    return m.group(1).lower() if m else None


def _title_words(title: str) -> set:
    t = re.sub(r"^\s*\d+[a-zA-Z]?\.\d+\s*", "", title or "")  # quita el código inicial
    return set(_norm(t).split())


def split_sections(text: str):
    """Devuelve [(code|None, title, body)] detectando encabezados ### o N.N."""
    sections, cur = [], None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            if cur:
                cur[2].append("")
            continue
        header_title = None
        if line.startswith("###"):
            header_title = line.lstrip("#").strip()
        elif _HEADER_RE.match(line):
            header_title = line
        elif re.match(r"^m[oó]dulo\b", line, re.IGNORECASE):
            continue  # línea de módulo: separador, no es clase
        if header_title is not None:
            if cur:
                sections.append((cur[0], cur[1], "\n".join(cur[2]).strip()))
            cur = [_code_of(header_title), header_title, []]
        elif cur:
            cur[2].append(raw)
    if cur:
        sections.append((cur[0], cur[1], "\n".join(cur[2]).strip()))
    return sections


def match_lesson(code, title, lessons):
    """Empareja una sección con una lección del diplomado. Devuelve el dict de la lección o None."""
    # 1) por código
    if code:
        for L in lessons:
            if _code_of(L["title"]) == code:
                return L
    # 2) por similitud de título (Jaccard de palabras), mejor match sobre umbral
    sw = _title_words(title)
    if sw:
        best, best_score = None, 0.0
        for L in lessons:
            lw = _title_words(L["title"])
            if not lw:
                continue
            inter = len(sw & lw)
            union = len(sw | lw)
            score = inter / union if union else 0.0
            if score > best_score:
                best, best_score = L, score
        if best_score >= 0.4:
            return best
    return None


def _chunk(text: str, size=1100, overlap=160):
    text = re.sub(r"\(\d+:\d+\)", "", text)          # quita timestamps (0:00)
    text = re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", text)).strip()
    parts = re.split(r"(?<=[\.\?!])\s+", text)
    res, buf = [], ""
    for p in parts:
        if len(buf) + len(p) + 1 <= size:
            buf = (buf + " " + p).strip()
        else:
            if buf:
                res.append(buf)
            buf = ((buf[-overlap:] if buf else "") + " " + p).strip()
    if buf:
        res.append(buf)
    return [c for c in res if len(c) > 80]


async def _embed_batch(client, texts):
    reqs = [{"model": settings.LOBO_EMBED_MODEL, "content": {"parts": [{"text": t}]},
             "outputDimensionality": _DIMS, "taskType": "RETRIEVAL_DOCUMENT"} for t in texts]
    for attempt in range(5):
        r = await client.post(f"{_BASE}/{settings.LOBO_EMBED_MODEL}:batchEmbedContents",
                              headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                              json={"requests": reqs})
        if r.status_code == 200:
            return [e["values"] for e in r.json()["embeddings"]]
        if r.status_code in (429, 500, 503):
            import asyncio
            await asyncio.sleep(3 * (attempt + 1)); continue
        raise RuntimeError(f"Embeddings {r.status_code}: {r.text[:160]}")
    raise RuntimeError("Embeddings: fallo tras reintentos")


async def ingest(diploma_slug: str, filename: str, data: bytes, lessons: list[dict]) -> dict:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("Falta GEMINI_API_KEY en el servidor.")
    text = extract_text(filename, data)
    sections = split_sections(text)
    if not sections:
        return {"ok": False, "error": "No encontré clases en el archivo. Cada clase debe ir precedida por su título (ej. «1.1 …») o por «### …»."}

    chunks, matched_titles, unmatched = [], [], []
    for code, title, body in sections:
        L = match_lesson(code, title, lessons)
        if not L or not body:
            if not L:
                unmatched.append(title)
            continue
        for c in _chunk(body):
            chunks.append({"lesson_id": str(L["id"]), "lesson_title": L["title"], "text": c})
        matched_titles.append((title, L["title"]))

    if not chunks:
        return {"ok": False, "error": "Ninguna clase se pudo emparejar con una lección. Revisa que los títulos coincidan.",
                "unmatched": unmatched}

    async with httpx.AsyncClient(timeout=180) as client:
        vecs = []
        for i in range(0, len(chunks), 50):
            vecs += await _embed_batch(client, [c["text"] for c in chunks[i:i + 50]])
    arr = np.array(vecs, dtype=np.float32)
    arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-9

    out = Path(settings.LOBO_LESSONS_DIR)
    out.mkdir(parents=True, exist_ok=True)
    import json
    (out / f"{diploma_slug}.chunks.json").write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    np.save(out / f"{diploma_slug}.npy", arr)
    lobo_lessons.reload_cache()

    return {"ok": True, "lecciones_emparejadas": len({c["lesson_id"] for c in chunks}),
            "fragmentos": len(chunks), "clases_detectadas": len(sections),
            "no_emparejadas": unmatched}
