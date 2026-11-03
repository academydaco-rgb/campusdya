import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.core.deps import get_current_user
from app.models.user import User
from app.models.reset import PasswordResetToken
from app.core.config import settings
from app.services.mailer import send_reset
from app.schemas.auth import LoginRequest, Token, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if user.status == "disabled":
        raise HTTPException(status_code=403, detail="Cuenta deshabilitada")
    token = create_access_token(str(user.id), user.role)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(data: ForgotRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user:
        tok = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(user_id=user.id, token=tok,
                                  expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
        await db.commit()
        url = f"{settings.FRONTEND_URL}/reset-password?token={tok}"
        await send_reset(user.email, user.name, url)
    # respuesta genérica (no revela si el correo existe)
    return {"ok": True}


@router.post("/reset-password")
async def reset_password(data: ResetRequest, db: AsyncSession = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    row = (await db.execute(select(PasswordResetToken).where(PasswordResetToken.token == data.token))).scalar_one_or_none()
    if not row or row.used or row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El enlace no es válido o ya expiró")
    user = (await db.execute(select(User).where(User.id == row.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password_hash = hash_password(data.new_password)
    user.status = "active"
    row.used = True
    await db.commit()
    return {"ok": True}
