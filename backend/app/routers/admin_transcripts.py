import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.config import settings
from app.models.user import User
from app.models.content import Diploma, Module, Lesson
from app.services import transcripts, lobo_lessons

router = APIRouter(prefix="/api/admin/diplomas", tags=["admin-transcripts"])

_MAX_BYTES = 20 * 1024 * 1024  # 20 MB


async def _diploma_and_lessons(db: AsyncSession, diploma_id: str):
    try:
        did = uuid.UUID(diploma_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    dip = (await db.execute(select(Diploma).where(Diploma.id == did))).scalar_one_or_none()
    if not dip:
        raise HTTPException(status_code=404, detail="Diplomado no encontrado")
    rows = (await db.execute(
        select(Lesson).join(Module, Lesson.module_id == Module.id)
        .where(Module.diploma_id == did).order_by(Module.order, Lesson.order)
    )).scalars().all()
    lessons = [{"id": str(l.id), "title": l.title} for l in rows]
    return dip, lessons


@router.get("/{diploma_id}/transcripts/status")
async def transcripts_status(diploma_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    dip, lessons = await _diploma_and_lessons(db, diploma_id)
    have = lobo_lessons.content_lesson_ids(dip.slug)
    ready = [l for l in lessons if l["id"] in have]
    return {
        "total": len(lessons),
        "con_tutor": len(ready),
        "sin_tutor": len(lessons) - len(ready),
        "configurado": bool(settings.GEMINI_API_KEY),
    }


@router.post("/{diploma_id}/transcripts")
async def upload_transcripts(diploma_id: str, file: UploadFile = File(...),
                             db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="El Tutor IA no está configurado (falta GEMINI_API_KEY).")
    dip, lessons = await _diploma_and_lessons(db, diploma_id)
    if not lessons:
        raise HTTPException(status_code=400, detail="Este diplomado aún no tiene lecciones creadas.")

    data = await file.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera los 20 MB.")
    try:
        text = transcripts.extract_text(file.filename or "archivo", data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=400, detail="No pude leer el archivo. ¿Está completo y en PDF, Word o txt?")

    if len((text or "").strip()) < 200:
        raise HTTPException(status_code=400, detail="El archivo no tiene texto legible (¿es un PDF escaneado como imagen?).")

    try:
        result = await transcripts.ingest(dip.slug, lessons, text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error procesando la transcripción: {type(e).__name__}")

    if not result.get("ok"):
        raise HTTPException(status_code=422, detail=result.get("error", "No se pudo emparejar ninguna lección."))
    return result
