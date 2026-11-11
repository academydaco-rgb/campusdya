import uuid
import secrets
from pydantic import BaseModel
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.content import Diploma, Module, Lesson
from app.models.catalog import Teacher
from app.models.learning import Enrollment, LessonProgress
from app.models.community import Comment
from app.models.gamification import Badge, UserBadge
from app.services.badges import award_diploma_if_complete
from app.services.routes import counts as route_counts, norm_route
from app.services.mailer import send_reply_notice
from app.core.config import settings as _settings
from app.schemas.content import DiplomaOut, LessonOut
from app.schemas.community import CommentCreate, CommentOut

router = APIRouter(prefix="/api", tags=["student"])


async def _is_enrolled(db: AsyncSession, user: User, diploma_id: uuid.UUID) -> bool:
    if user.role in ("admin", "instructor"):
        return True
    row = (await db.execute(select(Enrollment.id).where(
        Enrollment.user_id == user.id, Enrollment.diploma_id == diploma_id))).scalar_one_or_none()
    return row is not None


async def _diploma_progress(db: AsyncSession, user_id, diploma_id, is_admin: bool):
    """(total_lecciones, completadas, siguiente_leccion_pendiente|None).
    Con bifurcación cuenta módulos comunes + la ruta que lleva el estudiante."""
    dip = (await db.execute(select(Diploma).where(Diploma.id == diploma_id))).scalar_one_or_none()
    has_routes = bool(dip and dip.has_routes)
    mods = (await db.execute(select(Module).where(Module.diploma_id == diploma_id).order_by(Module.order))).scalars().all()
    done = set((await db.execute(select(LessonProgress.lesson_id).where(
        LessonProgress.user_id == user_id, LessonProgress.completed == True))).scalars().all())  # noqa: E712
    items = []  # (route, [lessons])
    for m in mods:
        if m.status != "published" and not is_admin:
            continue
        lessons = (await db.execute(select(Lesson).where(Lesson.module_id == m.id).order_by(Lesson.order))).scalars().all()
        items.append((norm_route(m.route) if has_routes else None,
                      [l for l in lessons if l.status == "published" or is_admin]))
    total, completed, chosen = route_counts([(r, [l.id for l in ls]) for r, ls in items], done, has_routes)
    next_lesson = None
    for r, ls in items:
        if has_routes and r and r != chosen:
            continue
        for l in ls:
            if l.id not in done:
                next_lesson = l
                break
        if next_lesson:
            break
    return total, completed, next_lesson


@router.get("/me/diplomas")
async def my_diplomas(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    is_admin = user.role in ("admin", "instructor")
    if is_admin:
        dips = (await db.execute(select(Diploma).order_by(Diploma.order))).scalars().all()
    else:
        dips = (await db.execute(select(Diploma).join(Enrollment, Enrollment.diploma_id == Diploma.id)
                .where(Enrollment.user_id == user.id, Diploma.status == "published")
                .order_by(Diploma.order))).scalars().all()
    out = []
    for d in dips:
        total, completed, _ = await _diploma_progress(db, user.id, d.id, is_admin)
        out.append({"id": str(d.id), "title": d.title, "slug": d.slug, "cover_url": d.cover_url,
                    "order": d.order, "total_lessons": total, "completed_lessons": completed,
                    "progress": round(100 * completed / total) if total else 0})
    return out


@router.get("/me/continue")
async def continue_learning(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Siguiente lección pendiente del diplomado con más avance (para 'continuar donde quedaste')."""
    is_admin = user.role in ("admin", "instructor")
    if is_admin:
        dips = (await db.execute(select(Diploma).order_by(Diploma.order))).scalars().all()
    else:
        dips = (await db.execute(select(Diploma).join(Enrollment, Enrollment.diploma_id == Diploma.id)
                .where(Enrollment.user_id == user.id, Diploma.status == "published")
                .order_by(Diploma.order))).scalars().all()
    best = None  # (score, dict)
    for d in dips:
        total, completed, nxt = await _diploma_progress(db, user.id, d.id, is_admin)
        if total == 0 or nxt is None:
            continue
        # prioriza diplomado empezado (completed>0), luego el primero
        score = (1 if completed > 0 else 0, completed)
        item = {"diploma_slug": d.slug, "diploma_title": d.title,
                "lesson_id": str(nxt.id), "lesson_title": nxt.title,
                "progress": round(100 * completed / total) if total else 0}
        if best is None or score > best[0]:
            best = (score, item)
    return best[1] if best else None


@router.get("/me/in-progress")
async def in_progress(limit: int = 3, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Diplomados que el alumno ha EMPEZADO (tiene actividad) y aún no completa,
    ordenados por lo más reciente que estudió. Para 'Continúa tu formación'."""
    is_admin = user.role in ("admin", "instructor")
    if is_admin:
        dips = (await db.execute(select(Diploma).order_by(Diploma.order))).scalars().all()
    else:
        dips = (await db.execute(select(Diploma).join(Enrollment, Enrollment.diploma_id == Diploma.id)
                .where(Enrollment.user_id == user.id, Diploma.status == "published")
                .order_by(Diploma.order))).scalars().all()
    items = []
    for d in dips:
        total, completed, nxt = await _diploma_progress(db, user.id, d.id, is_admin)
        if total == 0 or completed >= total:
            continue  # sin lecciones o ya completado -> no es "continuar"
        mod_ids = (await db.execute(select(Module.id).where(Module.diploma_id == d.id))).scalars().all()
        if not mod_ids:
            continue
        lesson_ids = (await db.execute(select(Lesson.id).where(Lesson.module_id.in_(mod_ids)))).scalars().all()
        if not lesson_ids:
            continue
        last = (await db.execute(select(func.max(LessonProgress.updated_at)).where(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id.in_(lesson_ids)))).scalar_one_or_none()
        if last is None:
            continue  # no ha estudiado nada de este diplomado
        items.append((last, {
            "diploma_slug": d.slug, "diploma_title": d.title, "cover_url": d.cover_url,
            "total_lessons": total, "completed_lessons": completed,
            "progress": round(100 * completed / total) if total else 0,
            "lesson_id": str(nxt.id) if nxt else None,
            "lesson_title": nxt.title if nxt else None,
        }))
    items.sort(key=lambda x: x[0], reverse=True)
    n = max(1, min(limit, 6))
    return [it for _, it in items[:n]]


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
        out_mods.append({"id": str(m.id), "title": m.title, "description": m.description, "cover_url": m.cover_url, "order": m.order,
                         "route": norm_route(m.route) if dip.has_routes else None, "lessons": out_lessons})
    total, completadas, chosen = route_counts(
        [(m["route"], [uuid.UUID(l["id"]) for l in m["lessons"]]) for m in out_mods], done, bool(dip.has_routes))
    teacher = None
    if dip.teacher_id:
        t = (await db.execute(select(Teacher).where(Teacher.id == dip.teacher_id))).scalar_one_or_none()
        if t:
            teacher = {"id": str(t.id), "name": t.name, "photo_url": t.photo_url, "bio": t.bio, "whatsapp": t.whatsapp}
    return {
        "id": str(dip.id), "title": dip.title, "slug": dip.slug,
        "description": dip.description, "cover_url": dip.cover_url, "teacher": teacher,
        "hero_image_url": dip.hero_image_url, "intro_video_url": dip.intro_video_url,
        "badge_image_url": dip.badge_image_url,
        "has_routes": bool(dip.has_routes), "chosen_route": chosen,
        "route_a_name": dip.route_a_name or "Ruta A", "route_b_name": dip.route_b_name or "Ruta B",
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
    # Registrar que el alumno ESTUDIÓ esta lección (aunque no la complete) + recencia
    if not (user.role in ("admin", "instructor")):
        now = datetime.now(timezone.utc)
        if prog is None:
            db.add(LessonProgress(user_id=user.id, lesson_id=lesson_id, completed=False))
        else:
            prog.updated_at = now
        await db.commit()
    data = LessonOut.model_validate(lesson).model_dump()
    data["completed"] = bool(prog and prog.completed)
    data["diploma_id"] = str(module.diploma_id)
    _dip = (await db.execute(select(Diploma).where(Diploma.id == module.diploma_id))).scalar_one_or_none()
    data["diploma_slug"] = _dip.slug if _dip else None
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
    c = Comment(lesson_id=lesson_id, user_id=user.id, parent_id=data.parent_id, body=data.body.strip(), rating=data.rating, image_url=data.image_url)
    db.add(c); await db.commit(); await db.refresh(c)
    # Notificar por correo al autor del comentario padre (si es otra persona)
    if data.parent_id:
        parent = (await db.execute(select(Comment).where(Comment.id == data.parent_id))).scalar_one_or_none()
        if parent and parent.user_id != user.id:
            padre = (await db.execute(select(User).where(User.id == parent.user_id))).scalar_one_or_none()
            if padre and padre.email:
                url = f"{_settings.FRONTEND_URL}/leccion/{lesson_id}"
                await send_reply_notice(padre.email, padre.name, lesson.title, url)
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
    changed = False
    out = []
    for ub, b in rows:
        if not ub.code:
            ub.code = secrets.token_hex(5).upper(); changed = True
        dip = dmap.get(b.rule_value or "")
        out.append({
            "id": str(b.id), "name": b.name, "description": b.description, "icon": b.icon,
            "image_url": (dip.badge_image_url if dip else None),
            "code": ub.code,
            "awarded_at": ub.awarded_at.isoformat() if ub.awarded_at else None,
            "diploma_title": dip.title if dip else None,
            "diploma_slug": dip.slug if dip else None,
        })
    if changed:
        await db.commit()
    return out


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdate(BaseModel):
    avatar_url: str | None = None
    bio: str | None = None
    name: str | None = None
    whatsapp: str | None = None
    profile_type: str | None = None  # dropshipper|proveedor|bodega


@router.put("/me/password")
async def change_password(data: PasswordChange, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"ok": True}


@router.put("/me/profile")
async def update_profile(data: ProfileUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url or None
    if data.bio is not None:
        user.bio = data.bio or None
    if data.name is not None and data.name.strip():
        user.name = data.name.strip()
    if data.whatsapp is not None:
        user.whatsapp = data.whatsapp.strip() or None
    if data.profile_type is not None:
        user.profile_type = (data.profile_type or None)
    await db.commit(); await db.refresh(user)
    return {"id": str(user.id), "name": user.name, "avatar_url": user.avatar_url, "bio": user.bio, "email": user.email, "role": user.role, "status": user.status, "whatsapp": user.whatsapp, "profile_type": user.profile_type}


@router.get("/users/{user_id}/public")
async def public_user_profile(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), viewer: User = Depends(get_current_user)):
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    rows = (await db.execute(
        select(UserBadge, Badge).join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == u.id).order_by(UserBadge.awarded_at.desc())
    )).all()
    dmap = {str(d.id): d for d in (await db.execute(select(Diploma))).scalars().all()}
    badges = []
    for ub, b in rows:
        dip = dmap.get(b.rule_value or "")
        badges.append({"id": str(b.id), "name": b.name, "icon": b.icon,
                       "image_url": (dip.badge_image_url if dip else None),
                       "diploma_title": (dip.title if dip else None)})
    return {"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url, "bio": u.bio, "whatsapp": u.whatsapp, "profile_type": u.profile_type, "badges": badges}


@router.post("/me/ping")
async def presence_ping(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    user.last_seen_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.get("/online-users")
async def online_users(db: AsyncSession = Depends(get_db), viewer: User = Depends(get_current_user)):
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=3)
    rows = (await db.execute(
        select(User).where(User.last_seen_at.isnot(None), User.last_seen_at >= cutoff)
        .order_by(User.last_seen_at.desc()).limit(40)
    )).scalars().all()
    return [{"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url} for u in rows]
