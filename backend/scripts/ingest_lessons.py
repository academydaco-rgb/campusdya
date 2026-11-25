#!/usr/bin/env python3
"""Ingesta de transcripciones por lección para el Tutor IA.

Toma UN archivo con todas las clases de un diplomado (cada clase precedida por
su título en una línea que empieza con `###`), empareja cada clase con su
lección de la plataforma y genera el índice (fragmentos + embeddings) que usa
el tutor de cada lección.

Uso:
    python -m scripts.ingest_lessons \
        --diploma meta-ads \
        --file transcripciones_meta_ads.txt \
        --lessons lessons_meta_ads.json

donde lessons_meta_ads.json es: [{"id": "<uuid>", "title": "8A.3 Escalar método 1"}, ...]
(se puede exportar desde la plataforma). Variable de entorno requerida: GEMINI_API_KEY.

El resultado se escribe en app/lobo_data/lessons/<diploma>.chunks.json y .npy
Reporta al final qué encabezados NO se pudieron emparejar (para corregir nombres).
"""
import argparse, json, os, re, sys, time, unicodedata
from pathlib import Path

import numpy as np
import httpx

BASE = "https://generativelanguage.googleapis.com/v1beta"
EMBED_MODEL = os.environ.get("LOBO_EMBED_MODEL", "models/gemini-embedding-001")
DIMS = 768
DATA = Path(__file__).resolve().parent.parent / "app" / "lobo_data" / "lessons"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def code_of(title: str):
    """Extrae el código inicial del título (8A.3, 1.1, 12, 5B…) si lo hay."""
    m = re.match(r"\s*([0-9]+[A-Za-z]?(?:\.[0-9]+)?)\b", title)
    return m.group(1).lower().replace(" ", "") if m else None


def read_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in (".txt", ".md"):
        return path.read_text(encoding="utf-8", errors="ignore")
    if ext == ".docx":
        from docx import Document
        return "\n".join(p.text for p in Document(str(path)).paragraphs)
    if ext == ".pdf":
        import subprocess
        out = path.with_suffix(".txt")
        subprocess.run(["pdftotext", "-layout", str(path), str(out)], check=True)
        return out.read_text(encoding="utf-8", errors="ignore")
    raise SystemExit(f"Formato no soportado: {ext} (usa .txt, .md, .docx o .pdf)")


def split_sections(text: str, marker: str = "###"):
    """Devuelve [(header, body)] partiendo por líneas que empiezan con el marcador."""
    sections, header, buf = [], None, []
    for line in text.splitlines():
        if line.lstrip().startswith(marker):
            if header is not None:
                sections.append((header, "\n".join(buf).strip()))
            header = line.lstrip()[len(marker):].strip()
            buf = []
        elif header is not None:
            buf.append(line)
    if header is not None:
        sections.append((header, "\n".join(buf).strip()))
    return sections


def chunk(text: str, size=1100, overlap=160):
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


def match_lesson(header: str, lessons):
    hc = code_of(header)
    hn = norm(header)
    # 1) por código inicial
    if hc:
        for L in lessons:
            if code_of(L["title"]) == hc:
                return L
    # 2) por título normalizado (contención en cualquier sentido)
    for L in lessons:
        ln = norm(L["title"])
        if ln and (ln in hn or hn in ln):
            return L
    return None


def embed_batch(client, texts):
    reqs = [{"model": EMBED_MODEL, "content": {"parts": [{"text": t}]},
             "outputDimensionality": DIMS, "taskType": "RETRIEVAL_DOCUMENT"} for t in texts]
    for attempt in range(5):
        r = client.post(f"{BASE}/{EMBED_MODEL}:batchEmbedContents",
                        headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
                        json={"requests": reqs})
        if r.status_code == 200:
            return [e["values"] for e in r.json()["embeddings"]]
        if r.status_code in (429, 500, 503):
            time.sleep(3 * (attempt + 1)); continue
        raise SystemExit(f"Embeddings {r.status_code}: {r.text[:200]}")
    raise SystemExit("Embeddings: fallo tras reintentos")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--diploma", required=True, help="slug del diplomado, ej. meta-ads")
    ap.add_argument("--file", required=True, help="archivo de transcripciones (.txt/.md/.docx/.pdf)")
    ap.add_argument("--lessons", required=True, help="JSON [{id,title}] de las lecciones del diplomado")
    ap.add_argument("--marker", default="###")
    args = ap.parse_args()

    if not os.environ.get("GEMINI_API_KEY"):
        raise SystemExit("Falta GEMINI_API_KEY en el entorno.")

    lessons = json.loads(Path(args.lessons).read_text(encoding="utf-8"))
    text = read_text(Path(args.file))
    sections = split_sections(text, args.marker)
    if not sections:
        raise SystemExit(f"No encontré ninguna clase con el marcador «{args.marker}». "
                         "Revisa que cada título empiece con ese marcador.")

    chunks, unmatched = [], []
    for header, body in sections:
        L = match_lesson(header, lessons)
        if not L:
            unmatched.append(header); continue
        for c in chunk(body):
            chunks.append({"lesson_id": str(L["id"]), "lesson_title": L["title"], "text": c})

    if not chunks:
        raise SystemExit("Ninguna clase se pudo emparejar con una lección. Revisa los títulos.")

    with httpx.Client(timeout=120) as client:
        vecs = []
        for i in range(0, len(chunks), 50):
            vecs += embed_batch(client, [c["text"] for c in chunks[i:i + 50]])
            print(f"  embeddings {min(i + 50, len(chunks))}/{len(chunks)}", end="\r")
    arr = np.array(vecs, dtype=np.float32)
    arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-9

    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f"{args.diploma}.chunks.json").write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    np.save(DATA / f"{args.diploma}.npy", arr)

    matched = {c["lesson_id"] for c in chunks}
    print(f"\n✅ {len(chunks)} fragmentos de {len(matched)} lecciones -> app/lobo_data/lessons/{args.diploma}.*")
    if unmatched:
        print(f"\n⚠️  {len(unmatched)} encabezados NO emparejados (revisa el nombre):")
        for h in unmatched:
            print("   -", h)


if __name__ == "__main__":
    main()
