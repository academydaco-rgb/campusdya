import uuid
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    cred_exc = HTTPException(status_code=401, detail="No autorizado")
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise cred_exc
    try:
        uid = uuid.UUID(str(payload["sub"]))
    except ValueError:
        raise cred_exc
    user = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if not user or user.status == "disabled":
        raise cred_exc
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Admin o instructor (gestión de contenido)."""
    if user.role not in ("admin", "instructor"):
        raise HTTPException(status_code=403, detail="Requiere rol de administrador")
    return user


async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    """Solo admin (gestión de usuarios/permisos)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Requiere rol admin")
    return user
