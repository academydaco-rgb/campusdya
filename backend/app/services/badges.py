"""Otorga insignia automáticamente al completar el 100% de un diplomado."""
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.content import Diploma, Module, Lesson
from app.models.learning import LessonProgress
from app.models.gamification import Badge, UserBadge


async def award_diploma_if_complete(db: AsyncSession, user_id: uuid.UUID, diploma_id: uuid.UUID):
    total = (await db.execute(
        select(func.count(Lesson.id))
        .select_from(Lesson)
        .join(Module, Module.id == Lesson.module_id)
        .where(Module.diploma_id == diploma_id,
               Lesson.status == "published", Module.status == "published")
    )).scalar_one()
    if not total:
        return None
    done = (await db.execute(
        select(func.count(LessonProgress.id))
        .select_from(LessonProgress)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .where(Module.diploma_id == diploma_id,
               LessonProgress.user_id == user_id,
               LessonProgress.completed == True)  # noqa: E712
    )).scalar_one()
    if done < total:
        return None

    dip = (await db.execute(select(Diploma).where(Diploma.id == diploma_id))).scalar_one_or_none()
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
    db.add(UserBadge(user_id=user_id, badge_id=badge.id))
    await db.commit()
    return badge
