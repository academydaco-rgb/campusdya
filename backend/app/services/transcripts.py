"""Ingesta de transcripciones por diplomado (para el Tutor IA de cada lección).

Recibe UN archivo (PDF, Word o texto) con todas las clases de un diplomado,
lo parte por lección emparejando cada sección con las lecciones reales del
diplomado (por el título), genera embeddings y guarda el índice en un volumen
persistente. Ignora números sueltos del texto porque el emparejamiento es
contra los títulos reales de las lecciones.
"""
import io
import json
import re
import time
import unicodedata
from pathlib import Path

import numpy as np
import httpx

from app.core.config import settings
from app.services import lobo_lessons

_BASE = "https://generativelanguage.googleapis.com/v1beta"
_DIMS = 768
_DIR = Path(settings.LOBO_LESSONS_DIR)


# ---------- extracción de texto ----------
def extract_text(filename: str, data: bytes) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    if ext in ("txt", "md", "vtt", "srt"):
        return data.decode("utf-8", errors="ignore")
    if ext == "pdf":
        from pypdf import PdfReader
        r = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in r.pages)
    if ext in ("docx",):
        from docx import Document
        return "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
    raise ValueError(f"Formato no soportado: .{ext} (usa PDF, Word .docx o .txt)")


# ---------- normalización / emparejamiento ----------
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s.lower())).strip()


def _strip_code(s: str) -> str:
    return re.sub(r"^\s*\d+[A-Za-z]?\.\d+\s+", "", s.strip())


def split_and_match(text: str, lessons: list[dict]):
    """lessons: [{id, title}]. Devuelve (sections[(id,title,body)], matched_ids, unmatched_titles)."""
    keys = [(ls, _norm(_strip_code(ls["title"]))) for ls in lessons]
    lines = text.splitlines()
    cand = []  # (line_index, normalized_candidate)
    for i, line in enumerate(lines):
        t = line.strip()
        if not t or len(t) > 110:
            continue
        c = _norm(_strip_code(t))
        if len(c) >= 6:
            cand.append((i, c))

    starts: dict = {}
    # Pase 1: coincidencia exacta de título
    for i, c in cand:
        for ls, key in keys:
            if ls["id"] in starts or not key:
                continue
            if key == c:
                starts[ls["id"]] = i
                break
    # Pase 2: contención (título dentro de la línea o viceversa)
    for i, c in cand:
        for ls, key in keys:
            if ls["id"] in starts or len(key) < 12:
                continue
            if key in c or c in key:
                starts[ls["id"]] = i
                break

    ordered = sorted(starts.items(), key=lambda kv: kv[1])
    title_by_id = {ls["id"]: ls["title"] for ls in lessons}
    sections = []
    for idx, (lid, li) in enumerate(ordered):
        end = ordered[idx + 1][1] if idx + 1 < len(ordered) else len(lines)
        body = "\n".join(lines[li + 1:end]).strip()
        if body:
            sections.append((lid, title_by_id[lid], body))
    matched = {lid for lid, _, _ in sections}
    unmatched = [ls["title"] for ls in lessons if ls["id"] not in matched]
    return sections, matched, unmatched


# ---------- chunking ----------
def _chunk(text: str, size=1400, overlap=160):
    text = re.sub(r"\(\d+:\d+\)", "", text)            # quita timestamps (0:00)
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


# ---------- embeddings ----------
async def _embed(client: httpx.AsyncClient, texts: list[str]) -> list[list[float]]:
    out = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        reqs = [{"model": settings.LOBO_EMBED_MODEL, "content": {"parts": [{"text": t}]},
                 "outputDimensionality": _DIMS, "taskType": "RETRIEVAL_DOCUMENT"} for t in batch]
        for attempt in range(5):
            r = await client.post(f"{_BASE}/{settings.LOBO_EMBED_MODEL}:batchEmbedContents",
                                  headers={"x-goog-api-key": settings.GEMINI_API_KEY}, json={"requests": reqs})
            if r.status_code == 200:
                out += [e["values"] for e in r.json()["embeddings"]]
                break
            if r.status_code in (429, 500, 503):
                time.sleep(2 * (attempt + 1)); continue
            raise RuntimeError(f"embeddings {r.status_code}: {r.text[:160]}")
        else:
            raise RuntimeError("embeddings: fallo tras reintentos")
    return out


# ---------- ingesta completa ----------
async def ingest(slug: str, lessons: list[dict], text: str) -> dict:
    sections, matched, unmatched = split_and_match(text, lessons)
    if not sections:
        return {"ok": False, "chunks": 0, "matched": 0, "total": len(lessons),
                "unmatched": unmatched,
                "error": "No pude emparejar ninguna clase con las lecciones. Revisa que el archivo tenga los títulos de las lecciones."}

    chunks = []
    for lid, title, body in sections:
        for c in _chunk(body):
            chunks.append({"lesson_id": str(lid), "lesson_title": title, "text": c})

    async with httpx.AsyncClient(timeout=110) as client:
        vecs = await _embed(client, [c["text"] for c in chunks])
    arr = np.array(vecs, dtype=np.float32)
    arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-9

    _DIR.mkdir(parents=True, exist_ok=True)
    (_DIR / f"{slug}.chunks.json").write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    np.save(_DIR / f"{slug}.npy", arr)
    lobo_lessons.reload_cache()

    return {"ok": True, "chunks": len(chunks), "matched": len(matched), "total": len(lessons),
            "matched_titles": [t for _, t, _ in sections], "unmatched": unmatched}
