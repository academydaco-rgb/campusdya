import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.catalog import Phase, Teacher, LiveClass, CasoExito, Tool
from app.models.provider import Provider
from app.models.content import Diploma, Module, Lesson
from app.models.learning import Enrollment, LessonProgress
from app.models.feedback import Feedback
from app.models.schedule import ScheduleEvent
from app.schemas.catalog import TeacherOut, LiveClassOut, CasoExitoOut, ToolOut
from app.schemas.provider import ProviderOut
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

    # progreso por diplomado (solo para alumnos reales matriculados)
    prog_map: dict[str, int] = {}
    if enrolled:
        rows = (await db.execute(
            select(Module.diploma_id, Lesson.id)
            .join(Lesson, Lesson.module_id == Module.id)
            .where(Module.diploma_id.in_(list(enrolled)))
        )).all()
        total_by: dict = {}
        lesson_to_dip: dict = {}
        for dip_id, lid in rows:
            total_by[dip_id] = total_by.get(dip_id, 0) + 1
            lesson_to_dip[lid] = dip_id
        done_ids = set()
        if lesson_to_dip:
            done_ids = set((await db.execute(
                select(LessonProgress.lesson_id).where(
                    LessonProgress.user_id == user.id,
                    LessonProgress.completed == True,  # noqa: E712
                    LessonProgress.lesson_id.in_(list(lesson_to_dip.keys())),
                )
            )).scalars().all())
        comp_by: dict = {}
        for lid in done_ids:
            dip_id = lesson_to_dip.get(lid)
            if dip_id:
                comp_by[dip_id] = comp_by.get(dip_id, 0) + 1
        for dip_id, tot in total_by.items():
            comp = comp_by.get(dip_id, 0)
            prog_map[str(dip_id)] = round(100 * comp / tot) if tot else 0

    def dip_json(d: Diploma) -> dict:
        j = {"id": str(d.id), "title": d.title, "slug": d.slug, "cover_url": d.cover_url,
             "order": d.order, "enrolled": d.id in enrolled}
        if d.id in enrolled:
            j["progress"] = prog_map.get(str(d.id), 0)
        return j

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


@router.get("/search")
async def search(q: str = "", db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Búsqueda global: diplomados, lecciones, clases en vivo, proveedores y profesores."""
    term = (q or "").strip()
    out: list[dict] = []
    if len(term) < 2:
        return out
    like = f"%{term}%"
    is_admin = user.role in ("admin", "instructor")

    # Diplomados publicados
    dips = (await db.execute(
        select(Diploma).where(Diploma.status == "published", Diploma.title.ilike(like)).order_by(Diploma.order).limit(5)
    )).scalars().all()
    if not is_admin and dips:
        enrolled = set((await db.execute(select(Enrollment.diploma_id).where(Enrollment.user_id == user.id))).scalars().all())
    else:
        enrolled = None
    for d in dips:
        ok = True if enrolled is None else (d.id in enrolled)
        out.append({"type": "Diplomado", "title": d.title,
                    "url": f"/diplomado/{d.slug}" if ok else "/explorar",
                    "subtitle": None if ok else "Sin acceso"})

    # Lecciones (dentro de diplomados publicados)
    lessons = (await db.execute(
        select(Lesson).where(Lesson.title.ilike(like)).order_by(Lesson.order).limit(6)
    )).scalars().all()
    for l in lessons:
        out.append({"type": "Lección", "title": l.title, "url": f"/leccion/{l.id}", "subtitle": None})

    # Clases en vivo
    lives = (await db.execute(
        select(LiveClass).where(LiveClass.status == "published", LiveClass.title.ilike(like)).limit(4)
    )).scalars().all()
    for c in lives:
        out.append({"type": "Clase en vivo", "title": c.title, "url": "/clases-en-vivo", "subtitle": None})

    # Proveedores
    provs = (await db.execute(
        select(Provider).where(Provider.status == "published", Provider.title.ilike(like)).limit(4)
    )).scalars().all()
    for pr in provs:
        out.append({"type": "Proveedor", "title": pr.title, "url": "/proveedores", "subtitle": None})

    # Profesores
    teachers = (await db.execute(
        select(Teacher).where(Teacher.status == "active", Teacher.name.ilike(like)).limit(4)
    )).scalars().all()
    for t in teachers:
        out.append({"type": "Profesor", "title": t.name, "url": "/profesores", "subtitle": None})

    return out[:10]


@router.get("/teachers", response_model=list[TeacherOut])
async def public_teachers(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    teachers = (await db.execute(select(Teacher).where(Teacher.status == "active").order_by(Teacher.order))).scalars().all()
    dips = (await db.execute(select(Diploma).where(Diploma.status == "published", Diploma.teacher_id.isnot(None)))).scalars().all()
    by_t: dict[str, list] = {}
    for d in dips:
        by_t.setdefault(str(d.teacher_id), []).append({"title": d.title, "slug": d.slug})
    out = []
    for t in teachers:
        row = TeacherOut.model_validate(t).model_dump()
        row["diplomas"] = by_t.get(str(t.id), [])
        out.append(row)
    return out


@router.get("/live-classes", response_model=list[LiveClassOut])
async def public_live(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(LiveClass).where(LiveClass.status == "published").order_by(LiveClass.happened_at.desc().nullslast()))).scalars().all()


@router.get("/success-cases", response_model=list[CasoExitoOut])
async def public_success_cases(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(CasoExito).where(CasoExito.status == "published").order_by(CasoExito.order, CasoExito.created_at.desc()))).scalars().all()


@router.get("/tools", response_model=list[ToolOut])
async def public_tools(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(Tool).where(Tool.status == "published").order_by(Tool.order, Tool.created_at.desc()))).scalars().all()


@router.get("/providers", response_model=list[ProviderOut])
async def public_providers(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(Provider).where(Provider.status == "published").order_by(Provider.created_at.desc()))).scalars().all()


@router.get("/classroom", response_model=list[ScheduleOut])
async def classroom(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return (await db.execute(select(ScheduleEvent).order_by(ScheduleEvent.starts_at))).scalars().all()


@router.get("/feedback", response_model=list[FeedbackOut])
async def list_feedback(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(select(Feedback).where(Feedback.status == "visible").order_by(Feedback.created_at.desc()).limit(200))).scalars().all()
    umap = {u.id: u for u in (await db.execute(select(User))).scalars().all()}
    out = []
    for f in rows:
        it = FeedbackOut.model_validate(f)
        u = umap.get(f.user_id)
        if u:
            it.author_name = u.name; it.author_avatar = u.avatar_url; it.author_bio = u.bio
        out.append(it)
    return out


@router.post("/feedback", response_model=FeedbackOut)
async def create_feedback(data: FeedbackCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    f = Feedback(user_id=user.id, body=data.body.strip(), results=(data.results or None), rating=data.rating, image_url=data.image_url)
    db.add(f); await db.commit(); await db.refresh(f)
    it = FeedbackOut.model_validate(f); it.author_name = user.name; it.author_avatar = user.avatar_url; it.author_bio = user.bio
    return it


@router.get("/community/top")
async def community_top(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(
        select(User.id, User.name, User.avatar_url, func.count(Feedback.id).label("n"))
        .join(Feedback, Feedback.user_id == User.id)
        .where(Feedback.status == "visible")
        .group_by(User.id, User.name, User.avatar_url)
        .order_by(func.count(Feedback.id).desc()).limit(10)
    )).all()
    return [{"id": str(r.id), "name": r.name, "avatar_url": r.avatar_url, "count": r.n} for r in rows]
