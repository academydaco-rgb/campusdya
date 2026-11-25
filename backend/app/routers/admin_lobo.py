import uuid as _uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.content import Diploma, Module, Lesson
from app.services import lobo_ingest, lobo_lessons

router = APIRouter(prefix="/api/admin", tags=["admin-lobo"])


async def _diploma_lessons(db: AsyncSession, diploma_id):
    dip = (await db.execute(select(Diploma).where(Diploma.id == diploma_id))).scalar_one_or_none()
    rows = (await db.execute(
        select(Lesson.id, Lesson.title).join(Module, Lesson.module_id == Module.id)
        .where(Module.diploma_id == diploma_id).order_by(Module.order, Lesson.order)
    )).all()
    lessons = [{"id": str(r.id), "title": r.title} for r in rows]
    return dip, lessons


@router.get("/diplomas/{diploma_id}/transcripts/status")
async def transcripts_status(diploma_id: str, db: AsyncSession = Depends(get_db),
                             user: User = Depends(require_admin)):
    try:
        did = _uuid.UUID(diploma_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Diploma inválido.")
    dip, lessons = await _diploma_lessons(db, did)
    if not dip:
        raise HTTPException(status_code=404, detail="Diploma no encontrado.")
    indexed = lobo_lessons.indexed_lesson_ids(dip.slug)
    con = sum(1 for L in lessons if str(L["id"]) in indexed)
    return {"total_lecciones": len(lessons), "con_tutor": con}


@router.post("/diplomas/{diploma_id}/transcripts")
async def ingest_transcripts(diploma_id: str, file: UploadFile = File(...),
                             db: AsyncSession = Depends(get_db), user: User = Depends(require_admin)):
    try:
        did = _uuid.UUID(diploma_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Diploma inválido.")
    dip, lessons = await _diploma_lessons(db, did)
    if not dip:
        raise HTTPException(status_code=404, detail="Diploma no encontrado.")
    if not lessons:
        raise HTTPException(status_code=400, detail="Este diploma no tiene lecciones creadas todavía.")

    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo supera 25 MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío.")

    try:
        report = await lobo_ingest.ingest(dip.slug, file.filename or "archivo.txt", data, lessons)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error procesando el archivo ({type(e).__name__}).")

    report["total_lecciones"] = len(lessons)
    return report
