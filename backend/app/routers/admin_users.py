import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_superadmin
from app.core.security import hash_password
from app.models.user import User
from app.models.content import Diploma
from app.models.learning import Enrollment
from app.schemas.auth import UserCreate, UserUpdate, UserOut, ImportRequest, ImportResult
from app.schemas.learning import EnrollmentCreate, EnrollmentOut
from app.services.mailer import send_credentials, enabled as mail_enabled

router = APIRouter(prefix="/api/admin", tags=["admin-users"])


def _temp_password() -> str:
    return secrets.token_urlsafe(9)


# ───────────── Usuarios ─────────────
@router.get("/users", response_model=list[UserOut])
async def list_users(q: str = Query(default=""), db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    stmt = select(User)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(User.email.ilike(like), User.name.ilike(like)))
    rows = (await db.execute(stmt.order_by(User.created_at.desc()).limit(500))).scalars().all()
    return rows


@router.post("/users")
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    email = data.email.lower().strip()
    exists = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")
    pwd = data.password or _temp_password()
    user = User(
        email=email, name=data.name, password_hash=hash_password(pwd),
        role=data.role, phone=data.phone, status="active",
    )
    db.add(user); await db.commit(); await db.refresh(user)
    sent = await send_credentials(user.email, user.name, pwd)
    return {
        "id": str(user.id), "email": user.email, "name": user.name, "role": user.role, "status": user.status,
        "password": pwd, "email_sent": sent,
    }


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: uuid.UUID, data: UserUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    patch = data.model_dump(exclude_unset=True)
    if "password" in patch:
        pw = patch.pop("password")
        if pw:
            user.password_hash = hash_password(pw)
            user.status = "active"
    for k, v in patch.items():
        setattr(user, k, v)
    await db.commit(); await db.refresh(user)
    return user


@router.post("/users/import", response_model=ImportResult)
async def import_users(data: ImportRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Carga masiva para migrar de la plataforma vieja. Idempotente por email."""
    creados = actualizados = inscripciones = 0
    errores: list[str] = []
    _to_mail: list[tuple[str, str, str]] = []
    # Mapa de diplomados por slug (para inscribir)
    diplomas = {d.slug: d for d in (await db.execute(select(Diploma))).scalars().all()}
    for row in data.users:
        try:
            email = row.email.lower().strip()
            user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
            if user:
                if row.name:
                    user.name = row.name
                actualizados += 1
            else:
                pwd = row.password or _temp_password()
                user = User(
                    email=email, name=row.name,
                    password_hash=hash_password(pwd),
                    role="alumno", status="active",
                )
                db.add(user)
                await db.flush()  # para obtener user.id
                _to_mail.append((email, row.name, pwd))
                creados += 1
            for slug in row.diploma_slugs:
                dip = diplomas.get(slug)
                if not dip:
                    errores.append(f"{email}: diplomado '{slug}' no existe")
                    continue
                ya = (await db.execute(select(Enrollment).where(
                    Enrollment.user_id == user.id, Enrollment.diploma_id == dip.id))).scalar_one_or_none()
                if not ya:
                    db.add(Enrollment(user_id=user.id, diploma_id=dip.id, granted_by=admin.id))
                    inscripciones += 1
        except Exception as e:  # noqa: BLE001
            errores.append(f"{row.email}: {str(e)[:120]}")
    await db.commit()
    for (em, nm, pw) in _to_mail:
        await send_credentials(em, nm, pw)
    if _to_mail and not mail_enabled():
        errores.append("Correo no configurado: no se enviaron credenciales por email (configura SMTP en el servidor).")
    return ImportResult(creados=creados, actualizados=actualizados, inscripciones=inscripciones, errores=errores)


# ───────────── Inscripciones (permisos por diplomado) ─────────────
@router.post("/enrollments", response_model=EnrollmentOut)
async def create_enrollment(data: EnrollmentCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    u = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    d = (await db.execute(select(Diploma).where(Diploma.id == data.diploma_id))).scalar_one_or_none()
    if not u or not d:
        raise HTTPException(status_code=404, detail="Usuario o diplomado no encontrado")
    existing = (await db.execute(select(Enrollment).where(
        Enrollment.user_id == data.user_id, Enrollment.diploma_id == data.diploma_id))).scalar_one_or_none()
    if existing:
        existing.expires_at = data.expires_at
        await db.commit(); await db.refresh(existing)
        return existing
    obj = Enrollment(user_id=data.user_id, diploma_id=data.diploma_id, expires_at=data.expires_at, granted_by=admin.id)
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/enrollments", response_model=list[EnrollmentOut])
async def list_enrollments(diploma_id: uuid.UUID | None = None, user_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    stmt = select(Enrollment)
    if diploma_id:
        stmt = stmt.where(Enrollment.diploma_id == diploma_id)
    if user_id:
        stmt = stmt.where(Enrollment.user_id == user_id)
    return (await db.execute(stmt)).scalars().all()


@router.delete("/enrollments/{enrollment_id}")
async def delete_enrollment(enrollment_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_superadmin)):
    obj = (await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    await db.delete(obj); await db.commit()
    return {"ok": True}
