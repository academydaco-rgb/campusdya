import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.catalog import Phase, Teacher, LiveClass
from app.models.provider import Provider
from app.models.community import Comment
from app.models.feedback import Feedback
from app.models.schedule import ScheduleEvent
from app.schemas.catalog import (
    PhaseCreate, PhaseUpdate, PhaseOut,
    TeacherCreate, TeacherUpdate, TeacherOut,
    LiveClassCreate, LiveClassUpdate, LiveClassOut,
)
from app.schemas.provider import ProviderCreate, ProviderUpdate, ProviderOut
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleOut
from app.schemas.feedback import FeedbackOut
from app.schemas.community import CommentOut
from app.services.text import slugify

router = APIRouter(prefix="/api/admin", tags=["admin-catalog"])


async def _get(db: AsyncSession, model, obj_id: uuid.UUID):
    obj = (await db.execute(select(model).where(model.id == obj_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} no encontrado")
    return obj


def _apply(obj, data):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)


# ───────── Fases ─────────
@router.post("/phases", response_model=PhaseOut)
async def create_phase(data: PhaseCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = Phase(**{**data.model_dump(), "slug": data.slug or slugify(data.name)})
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/phases", response_model=list[PhaseOut])
async def list_phases_admin(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(Phase).order_by(Phase.order))).scalars().all()


@router.put("/phases/{phase_id}", response_model=PhaseOut)
async def update_phase(phase_id: uuid.UUID, data: PhaseUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Phase, phase_id); _apply(obj, data); await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Phase, phase_id); await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────── Profesores ─────────
@router.post("/teachers", response_model=TeacherOut)
async def create_teacher(data: TeacherCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = Teacher(**data.model_dump()); db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/teachers", response_model=list[TeacherOut])
async def list_teachers_admin(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(Teacher).order_by(Teacher.order))).scalars().all()


@router.put("/teachers/{teacher_id}", response_model=TeacherOut)
async def update_teacher(teacher_id: uuid.UUID, data: TeacherUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Teacher, teacher_id); _apply(obj, data); await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Teacher, teacher_id); await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────── Clases en vivo ─────────
@router.post("/live-classes", response_model=LiveClassOut)
async def create_live(data: LiveClassCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = LiveClass(**data.model_dump()); db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/live-classes", response_model=list[LiveClassOut])
async def list_live_admin(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(LiveClass).order_by(LiveClass.happened_at.desc().nullslast()))).scalars().all()


@router.put("/live-classes/{live_id}", response_model=LiveClassOut)
async def update_live(live_id: uuid.UUID, data: LiveClassUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, LiveClass, live_id); _apply(obj, data); await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/live-classes/{live_id}")
async def delete_live(live_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, LiveClass, live_id); await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────── Proveedores ─────────
@router.post("/providers", response_model=ProviderOut)
async def create_provider(data: ProviderCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = Provider(**data.model_dump()); db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/providers", response_model=list[ProviderOut])
async def list_providers_admin(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(Provider).order_by(Provider.created_at.desc()))).scalars().all()


@router.put("/providers/{provider_id}", response_model=ProviderOut)
async def update_provider(provider_id: uuid.UUID, data: ProviderUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Provider, provider_id); _apply(obj, data); await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/providers/{provider_id}")
async def delete_provider(provider_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Provider, provider_id); await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────── Classroom / cronograma ─────────
@router.post("/schedule", response_model=ScheduleOut)
async def create_event(data: ScheduleCreate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = ScheduleEvent(**data.model_dump()); db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/schedule", response_model=list[ScheduleOut])
async def list_events_admin(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    return (await db.execute(select(ScheduleEvent).order_by(ScheduleEvent.starts_at))).scalars().all()


@router.put("/schedule/{event_id}", response_model=ScheduleOut)
async def update_event(event_id: uuid.UUID, data: ScheduleUpdate, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, ScheduleEvent, event_id); _apply(obj, data); await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/schedule/{event_id}")
async def delete_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, ScheduleEvent, event_id); await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────── Moderación ─────────
@router.get("/comments", response_model=list[CommentOut])
async def mod_comments(lesson_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    stmt = select(Comment).order_by(Comment.created_at.desc())
    if lesson_id:
        stmt = stmt.where(Comment.lesson_id == lesson_id)
    rows = (await db.execute(stmt.limit(500))).scalars().all()
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars().all()}
    out = []
    for c in rows:
        it = CommentOut.model_validate(c); it.author_name = names.get(c.user_id); out.append(it)
    return out


@router.put("/comments/{comment_id}")
async def set_comment_status(comment_id: uuid.UUID, status: str = Query(...), db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Comment, comment_id); obj.status = status; await db.commit()
    return {"ok": True, "status": obj.status}


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Comment, comment_id); await db.delete(obj); await db.commit()
    return {"ok": True}


@router.get("/feedback", response_model=list[FeedbackOut])
async def mod_feedback(db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    rows = (await db.execute(select(Feedback).order_by(Feedback.created_at.desc()).limit(500))).scalars().all()
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars().all()}
    out = []
    for f in rows:
        it = FeedbackOut.model_validate(f); it.author_name = names.get(f.user_id); out.append(it)
    return out


@router.put("/feedback/{feedback_id}")
async def set_feedback_status(feedback_id: uuid.UUID, status: str = Query(...), db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Feedback, feedback_id); obj.status = status; await db.commit()
    return {"ok": True, "status": obj.status}


@router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: uuid.UUID, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    obj = await _get(db, Feedback, feedback_id); await db.delete(obj); await db.commit()
    return {"ok": True}
