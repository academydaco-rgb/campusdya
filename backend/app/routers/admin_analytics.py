from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.learning import Enrollment, LessonProgress
from app.models.community import Post, PostComment
from app.models.gamification import UserStats

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


def _now():
    return datetime.now(timezone.utc)


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    now = _now()
    d7 = now - timedelta(days=7)
    d1 = now - timedelta(days=1)

    total_students = (await db.execute(select(func.count()).select_from(User).where(User.role == "alumno"))).scalar_one()
    new_7d = (await db.execute(select(func.count()).select_from(User).where(User.role == "alumno", User.created_at >= d7))).scalar_one()
    active_7d = (await db.execute(select(func.count(distinct(LessonProgress.user_id))).where(LessonProgress.updated_at >= d7))).scalar_one()
    active_24h = (await db.execute(select(func.count(distinct(LessonProgress.user_id))).where(LessonProgress.updated_at >= d1))).scalar_one()
    done_7d = (await db.execute(select(func.count()).select_from(LessonProgress).where(LessonProgress.completed == True, LessonProgress.completed_at >= d7))).scalar_one()  # noqa: E712
    enrollments = (await db.execute(select(func.count()).select_from(Enrollment))).scalar_one()
    posts_7d = (await db.execute(select(func.count()).select_from(Post).where(Post.created_at >= d7))).scalar_one()
    comments_7d = (await db.execute(select(func.count()).select_from(PostComment).where(PostComment.created_at >= d7))).scalar_one()

    return {
        "total_students": int(total_students),
        "new_7d": int(new_7d),
        "active_7d": int(active_7d),
        "active_24h": int(active_24h),
        "lessons_done_7d": int(done_7d),
        "enrollments": int(enrollments),
        "posts_7d": int(posts_7d),
        "comments_7d": int(comments_7d),
    }


@router.get("/activity")
async def activity(days: int = 14, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    days = max(7, min(60, days))
    since = _now() - timedelta(days=days)
    rows = (await db.execute(
        select(LessonProgress.completed_at).where(LessonProgress.completed == True, LessonProgress.completed_at >= since)  # noqa: E712
    )).scalars().all()
    buckets: dict[str, int] = {}
    for i in range(days):
        day = (_now() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        buckets[day] = 0
    for ca in rows:
        if ca:
            k = ca.strftime("%Y-%m-%d")
            if k in buckets:
                buckets[k] += 1
    return [{"day": k, "count": v} for k, v in buckets.items()]


@router.get("/students")
async def students(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    now = _now()
    d7 = now - timedelta(days=7)
    us = (await db.execute(select(User).where(User.role == "alumno"))).scalars().all()
    stats = {s.user_id: s for s in (await db.execute(select(UserStats))).scalars().all()}
    done = dict((await db.execute(
        select(LessonProgress.user_id, func.count()).where(LessonProgress.completed == True).group_by(LessonProgress.user_id)  # noqa: E712
    )).all())
    last = dict((await db.execute(
        select(LessonProgress.user_id, func.max(LessonProgress.updated_at)).group_by(LessonProgress.user_id)
    )).all())
    enr = dict((await db.execute(
        select(Enrollment.user_id, func.count()).group_by(Enrollment.user_id)
    )).all())

    out = []
    for u in us:
        la = last.get(u.id)
        n_enr = int(enr.get(u.id, 0))
        stalled = n_enr > 0 and (la is None or la < d7)
        st = stats.get(u.id)
        out.append({
            "id": str(u.id), "name": u.name, "email": u.email, "avatar_url": u.avatar_url,
            "last_active": la.isoformat() if la else None,
            "lessons_done": int(done.get(u.id, 0)),
            "enrollments": n_enr,
            "xp": st.xp if st else 0,
            "streak": st.streak_current if st else 0,
            "stalled": stalled,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    out.sort(key=lambda x: (x["last_active"] or ""), reverse=True)
    return out
