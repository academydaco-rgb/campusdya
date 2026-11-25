from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.lobo import LoboUsage
from app.services import lobo as lobo_service

router = APIRouter(prefix="/api/lobo", tags=["lobo"])


class ImageIn(BaseModel):
    mime: str = "image/png"
    data: str  # base64 sin el prefijo data:


class Turn(BaseModel):
    role: str  # 'user' | 'model'
    text: str = ""


class ChatIn(BaseModel):
    message: str = ""
    history: list[Turn] = []
    image: ImageIn | None = None


async def _usage_row(db: AsyncSession, user: User):
    today = date.today()
    row = (await db.execute(
        select(LoboUsage).where(LoboUsage.user_id == user.id, LoboUsage.day == today)
    )).scalar_one_or_none()
    return today, row


@router.get("/status")
async def status(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    _, row = await _usage_row(db, user)
    used = row.count if row else 0
    return {"used": used, "limit": settings.LOBO_DAILY_LIMIT,
            "remaining": max(0, settings.LOBO_DAILY_LIMIT - used)}


@router.post("/chat")
async def chat(payload: ChatIn, db: AsyncSession = Depends(get_db),
               user: User = Depends(get_current_user)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="LOBO ADS aún no está configurado.")
    if not (payload.message or "").strip() and not payload.image:
        raise HTTPException(status_code=400, detail="Escribe un mensaje.")

    today, row = await _usage_row(db, user)
    used = row.count if row else 0
    if used >= settings.LOBO_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Llegaste al límite de {settings.LOBO_DAILY_LIMIT} mensajes de hoy con LOBO ADS. "
                   "Vuelve mañana para seguir. 🐺",
        )
    if row:
        row.count = used + 1
    else:
        db.add(LoboUsage(user_id=user.id, day=today, count=1))
    await db.commit()
    remaining = settings.LOBO_DAILY_LIMIT - (used + 1)

    hist = [{"role": t.role, "text": t.text} for t in payload.history]
    img = {"mime": payload.image.mime, "data": payload.image.data} if payload.image else None
    try:
        reply = await lobo_service.answer(hist, payload.message, img)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"No pude consultar a LOBO ADS ({type(e).__name__}). Intenta de nuevo.")
    return {"reply": reply, "remaining": remaining}
