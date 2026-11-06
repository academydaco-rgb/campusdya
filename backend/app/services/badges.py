"""Otorga insignia automáticamente al completar el 100% de un diplomado."""
import uuid
import secrets
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.content import Diploma, Module, Lesson
from app.models.learning import LessonProgress
from app.models.gamification import Badge, UserBadge
from app.services.routes import counts as route_counts, norm_route


async def award_diploma_if_complete(db: AsyncSession, user_id: uuid.UUID, diploma_id: uuid.UUID):
    dip = (await db.execute(select(Diploma).where(Diploma.id == diploma_id))).scalar_one_or_none()
    has_routes = bool(dip and dip.has_routes)
    mods = (await db.execute(select(Module).where(
        Module.diploma_id == diploma_id, Module.status == "published"))).scalars().all()
    items = []
    for m in mods:
        lids = (await db.execute(select(Lesson.id).where(
            Lesson.module_id == m.id, Lesson.status == "published"))).scalars().all()
        items.append((norm_route(m.route) if has_routes else None, list(lids)))
    done = set((await db.execute(select(LessonProgress.lesson_id).where(
        LessonProgress.user_id == user_id, LessonProgress.completed == True))).scalars().all())  # noqa: E712
    total, completed, _ = route_counts(items, done, has_routes)
    if not total or completed < total:
        return None

    badge = (await db.execute(select(Badge).where(
        Badge.rule_type == "complete_diploma", Badge.rule_value == str(diploma_id)))).scalar_one_or_none()
    if not badge:
        badge = Badge(name=f"Diplomado: {dip.title if dip else 'D&A'}",
                      description="Completó el diplomado", icon="🏅",
                      rule_type="complete_diploma", rule_value=str(diploma_id))
        db.add(badge)
        await db.flush()
    exists = (await db.execute(select(UserBadge).where(
        UserBadge.user_id == user_id, UserBadge.badge_id == badge.id))).scalar_one_or_none()
    if exists:
        return None
    code = secrets.token_hex(5).upper()  # 10 hex chars
    db.add(UserBadge(user_id=user_id, badge_id=badge.id, code=code))
    await db.commit()
    return badge
