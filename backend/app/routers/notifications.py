import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.notification import Notification, NotificationRead
from app.schemas.notification import NotificationCreate, NotificationOut

router = APIRouter(prefix="/api", tags=["notificaciones"])


async def _read_ids(db: AsyncSession, user_id) -> set:
    return set((await db.execute(select(NotificationRead.notification_id).where(NotificationRead.user_id == user_id))).scalars().all())


# ── Usuario ──
@router.get("/notifications")
async def list_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    notifs = (await db.execute(
        select(Notification).where(Notification.status == "published").order_by(Notification.created_at.desc()).limit(30)
    )).scalars().all()
    read_ids = await _read_ids(db, user.id)
    return [{
        "id": str(n.id), "title": n.title, "body": n.body, "image_url": n.image_url,
        "link_url": n.link_url, "link_label": n.link_label,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "read": n.id in read_ids,
    } for n in notifs]


@router.get("/notifications/unread_count")
async def unread_count(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    total = set((await db.execute(select(Notification.id).where(Notification.status == "published"))).scalars().all())
    read_ids = await _read_ids(db, user.id)
    return {"count": len(total - read_ids)}


@router.post("/notifications/mark_read")
async def mark_read(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    total = set((await db.execute(select(Notification.id).where(Notification.status == "published"))).scalars().all())
    read_ids = await _read_ids(db, user.id)
    for nid in (total - read_ids):
        db.add(NotificationRead(user_id=user.id, notification_id=nid))
    await db.commit()
    return {"ok": True}


# ── Admin ──
@router.get("/admin/notifications", response_model=list[NotificationOut])
async def admin_list(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(Notification).order_by(Notification.created_at.desc()))).scalars().all()


@router.post("/admin/notifications", response_model=NotificationOut)
async def admin_create(data: NotificationCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    n = Notification(title=data.title.strip(), body=data.body.strip(), image_url=data.image_url or None,
                     link_url=(data.link_url or None), link_label=(data.link_label or None), created_by=a.id)
    db.add(n); await db.commit(); await db.refresh(n)
    return n


@router.put("/admin/notifications/{nid}", response_model=NotificationOut)
async def admin_update(nid: uuid.UUID, data: NotificationCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    n = (await db.execute(select(Notification).where(Notification.id == nid))).scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="No existe")
    n.title = data.title.strip(); n.body = data.body.strip(); n.image_url = data.image_url or None
    n.link_url = data.link_url or None; n.link_label = data.link_label or None
    await db.commit(); await db.refresh(n)
    return n


@router.delete("/admin/notifications/{nid}")
async def admin_delete(nid: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    n = (await db.execute(select(Notification).where(Notification.id == nid))).scalar_one_or_none()
    if n:
        await db.delete(n); await db.commit()
    return {"ok": True}
