import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.catalog import Phase, Teacher, LiveClass
from app.models.content import Diploma
from app.models.learning import Enrollment
from app.models.feedback import Feedback
from app.models.schedule import ScheduleEvent
from app.schemas.catalog import TeacherOut, LiveClassOut
from app.schemas.schedule import ScheduleOut
from app.schemas.feedback import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/api", tags=["catalogo"])


@router.get("/phases")
async def universe(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """El 'universo': fases (planetas) con sus diplomados publicados y si el alumno tiene acceso."""
    is_admin = user.role in ("admin", "instructor")
    phases = (await db.execute(select(Phase).order_by(Phase.order))).scalars().all()
    diplomas = (await db.execute(select(Diploma).where(Diploma.status == "published").order_by(Diploma.order))).scalars().all()
    if is_admin:
        enrolled: set[uuid.UUID] = {d.id for d in diplomas}
    else:
        enrolled = set((await db.execute(select(Enrollment.diploma_id).where(Enrollment.user_id == user.id))).scalars().all())

    def dip_json(d: Diploma) -> dict:
        return {"id": str(d.id), "title": d.title, "slug": d.slug, "cover_url": d.cover_url,
                "order": d.order, "enrolled": d.id in enrolled}

    by_phase: dict = {}
    sin_fase = []
    for d in diplomas:
        if d.phase_id:
            by_phase.setdefault(str(d.phase_id), []).append(dip_json(d))
        else:
            sin_fase.append(dip_json(d))

    out = [{
        "id": str(p.id), "name": p.name, "slug": p.slug, "description": p.description,
        "icon": p.icon, "color": p.color, "order": p.order,
        "diplomas": by_phase.get(str(p.id), []),
    } for p in phases]
    return {"phases": out, "sin_fase": sin_fase}


@router.get("/teachers", response_model=list[TeacherOut])
async def public_teachers(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(Teacher).where(Teacher.status == "active").order_by(Teacher.order))).scalars().all()


@router.get("/live-classes", response_model=list[LiveClassOut])
async def public_live(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(LiveClass).where(LiveClass.status == "published").order_by(LiveClass.happened_at.desc().nullslast()))).scalars().all()


@router.get("/classroom", response_model=list[ScheduleOut])
async def classroom(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(ScheduleEvent).order_by(ScheduleEvent.starts_at))).scalars().all()


@router.get("/feedback", response_model=list[FeedbackOut])
async def list_feedback(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(select(Feedback).where(Feedback.status == "visible").order_by(Feedback.created_at.desc()).limit(200))).scalars().all()
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars().all()}
    out = []
    for f in rows:
        it = FeedbackOut.model_validate(f); it.author_name = names.get(f.user_id); out.append(it)
    return out


@router.post("/feedback", response_model=FeedbackOut)
async def create_feedback(data: FeedbackCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    f = Feedback(user_id=user.id, body=data.body.strip(), results=(data.results or None), rating=data.rating, image_url=data.image_url)
    db.add(f); await db.commit(); await db.refresh(f)
    it = FeedbackOut.model_validate(f); it.author_name = user.name
    return it
