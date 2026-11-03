import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.content import Diploma, Module, Lesson
from app.models.learning import Enrollment, LessonProgress
from app.models.community import Comment
from app.models.gamification import Badge, UserBadge
from app.services.badges import award_diploma_if_complete
from app.schemas.content import DiplomaOut, LessonOut
from app.schemas.community import CommentCreate, CommentOut

router = APIRouter(prefix="/api", tags=["student"])


async def _is_enrolled(db: AsyncSession, user: User, diploma_id: uuid.UUID) -> bool:
    if user.role in ("admin", "instructor"):
        return True
    row = (await db.execute(select(Enrollment.id).where(
        Enrollment.user_id == user.id, Enrollment.diploma_id == diploma_id))).scalar_one_or_none()
    return row is not None


@router.get("/me/diplomas", response_model=list[DiplomaOut])
async def my_diplomas(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role in ("admin", "instructor"):
        stmt = select(Diploma).order_by(Diploma.order)
    else:
        stmt = (select(Diploma).join(Enrollment, Enrollment.diploma_id == Diploma.id)
                .where(Enrollment.user_id == user.id, Diploma.status == "published")
                .order_by(Diploma.order))
    return (await db.execute(stmt)).scalars().all()


@router.get("/diplomas/{slug}")
async def diploma_detail(slug: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    dip = (await db.execute(select(Diploma).where(Diploma.slug == slug))).scalar_one_or_none()
    if not dip:
        raise HTTPException(status_code=404, detail="Diplomado no encontrado")
    if not await _is_enrolled(db, user, dip.id):
        raise HTTPException(status_code=403, detail="No estás inscrito en este diplomado")
    is_admin = user.role in ("admin", "instructor")
    mods = (await db.execute(select(Module).where(Module.diploma_id == dip.id).order_by(Module.order))).scalars().all()
    # progreso del alumno
    done = set((await db.execute(select(LessonProgress.lesson_id).where(
        LessonProgress.user_id == user.id, LessonProgress.completed == True))).scalars().all())  # noqa: E712
    out_mods = []
    for m in mods:
        if m.status != "published" and not is_admin:
            continue
        lessons = (await db.execute(select(Lesson).where(Lesson.module_id == m.id).order_by(Lesson.order))).scalars().all()
        out_lessons = [{
            "id": str(l.id), "title": l.title, "slug": l.slug,
            "duration_seconds": l.duration_seconds, "order": l.order,
            "completed": l.id in done,
        } for l in lessons if (l.status == "published" or is_admin)]
        out_mods.append({"id": str(m.id), "title": m.title, "description": m.description, "cover_url": m.cover_url, "order": m.order, "lessons": out_lessons})
    total = sum(len(m["lessons"]) for m in out_mods)
    completadas = sum(1 for m in out_mods for l in m["lessons"] if l["completed"])
    return {
        "id": str(dip.id), "title": dip.title, "slug": dip.slug,
        "description": dip.description, "cover_url": dip.cover_url,
        "modules": out_mods, "total_lessons": total, "completed_lessons": completadas,
        "progress": round(100 * completadas / total) if total else 0,
    }


@router.get("/lessons/{lesson_id}")
async def lesson_detail(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one_or_none()
    if not module or not await _is_enrolled(db, user, module.diploma_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta lección")
    prog = (await db.execute(select(LessonProgress).where(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id))).scalar_one_or_none()
    data = LessonOut.model_validate(lesson).model_dump()
    data["completed"] = bool(prog and prog.completed)
    data["diploma_id"] = str(module.diploma_id)
    return data


@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one_or_none()
    if not module or not await _is_enrolled(db, user, module.diploma_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta lección")
    prog = (await db.execute(select(LessonProgress).where(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id))).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if prog:
        prog.completed = True
        prog.completed_at = prog.completed_at or now
    else:
        db.add(LessonProgress(user_id=user.id, lesson_id=lesson_id, completed=True, completed_at=now))
    await db.commit()
    badge = await award_diploma_if_complete(db, user.id, module.diploma_id)
    return {"ok": True, "completed": True, "badge": ({"name": badge.name, "icon": badge.icon} if badge else None)}


@router.get("/lessons/{lesson_id}/comments", response_model=list[CommentOut])
async def list_comments(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one_or_none()
    if not module or not await _is_enrolled(db, user, module.diploma_id):
        raise HTTPException(status_code=403, detail="Sin acceso")
    rows = (await db.execute(select(Comment).where(
        Comment.lesson_id == lesson_id, Comment.status == "visible").order_by(Comment.created_at))).scalars().all()
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars().all()}
    out = []
    for c in rows:
        item = CommentOut.model_validate(c)
        item.author_name = names.get(c.user_id)
        out.append(item)
    return out


@router.post("/lessons/{lesson_id}/comments", response_model=CommentOut)
async def create_comment(lesson_id: uuid.UUID, data: CommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one_or_none()
    if not module or not await _is_enrolled(db, user, module.diploma_id):
        raise HTTPException(status_code=403, detail="Sin acceso")
    c = Comment(lesson_id=lesson_id, user_id=user.id, parent_id=data.parent_id, body=data.body.strip())
    db.add(c); await db.commit(); await db.refresh(c)
    item = CommentOut.model_validate(c)
    item.author_name = user.name
    return item


@router.get("/me/badges")
async def my_badges(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(
        select(UserBadge, Badge).join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user.id).order_by(UserBadge.awarded_at.desc())
    )).all()
    # mapa de diplomas por id (para slug/título en insignias de diplomado)
    dmap = {str(d.id): d for d in (await db.execute(select(Diploma))).scalars().all()}
    out = []
    for ub, b in rows:
        dip = dmap.get(b.rule_value or "")
        out.append({
            "id": str(b.id), "name": b.name, "description": b.description, "icon": b.icon,
            "awarded_at": ub.awarded_at.isoformat() if ub.awarded_at else None,
            "diploma_title": dip.title if dip else None,
            "diploma_slug": dip.slug if dip else None,
        })
    return out
