import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.gamification import UserBadge, Badge
from app.models.user import User
from app.models.content import Diploma

router = APIRouter(prefix="/api/certificates", tags=["certificados"])


@router.get("/verify/{code}")
async def verify(code: str, db: AsyncSession = Depends(get_db)):
    """Verificación pública de un certificado por su código (sin login)."""
    ub = (await db.execute(select(UserBadge).where(UserBadge.code == code.upper().strip()))).scalar_one_or_none()
    if not ub:
        return {"valid": False}
    badge = (await db.execute(select(Badge).where(Badge.id == ub.badge_id))).scalar_one_or_none()
    user = (await db.execute(select(User).where(User.id == ub.user_id))).scalar_one_or_none()
    dip = None
    if badge and badge.rule_value:
        try:
            dip = (await db.execute(select(Diploma).where(Diploma.id == uuid.UUID(badge.rule_value)))).scalar_one_or_none()
        except Exception:
            dip = None
    return {
        "valid": True,
        "code": ub.code,
        "student_name": user.name if user else "Alumno",
        "diploma_title": (dip.title if dip else (badge.name if badge else "Diplomado")),
        "awarded_at": ub.awarded_at.isoformat() if ub.awarded_at else None,
    }
