import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementOut

router = APIRouter(prefix="/api", tags=["comunicados"])


def _expiry(days: int | None):
    if days and days > 0:
        return datetime.now(timezone.utc) + timedelta(days=days)
    return None


# ── Público / alumno ──
@router.get("/announcements", response_model=list[AnnouncementOut])
async def list_active(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    stmt = (select(Announcement).where(
        Announcement.status == "visible",
        Announcement.starts_at <= now,
        or_(Announcement.expires_at.is_(None), Announcement.expires_at > now),
    ).order_by(Announcement.created_at.desc()).limit(30))
    return (await db.execute(stmt)).scalars().all()


# ── Admin ──
@router.get("/admin/announcements", response_model=list[AnnouncementOut])
async def list_all(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(Announcement).order_by(Announcement.created_at.desc()).limit(200))).scalars().all()


@router.post("/admin/announcements", response_model=AnnouncementOut)
async def create(data: AnnouncementCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = Announcement(title=data.title, body=data.body, image_url=data.image_url,
                       expires_at=_expiry(data.visible_days), created_by=a.id)
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.put("/admin/announcements/{ann_id}", response_model=AnnouncementOut)
async def update(ann_id: uuid.UUID, data: AnnouncementUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = (await db.execute(select(Announcement).where(Announcement.id == ann_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    patch = data.model_dump(exclude_unset=True)
    if "visible_days" in patch:
        obj.expires_at = _expiry(patch.pop("visible_days"))
    for k, v in patch.items():
        setattr(obj, k, v)
    await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/admin/announcements/{ann_id}")
async def delete(ann_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = (await db.execute(select(Announcement).where(Announcement.id == ann_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    await db.delete(obj); await db.commit()
    return {"ok": True}
