from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.gamification import UserStats, XpEvent
from app.services.gamification import level_info

router = APIRouter(prefix="/api", tags=["gamification"])


async def _week_xp_map(db: AsyncSession):
    since = datetime.now(timezone.utc) - timedelta(days=7)
    rows = (await db.execute(
        select(XpEvent.user_id, func.coalesce(func.sum(XpEvent.amount), 0))
        .where(XpEvent.created_at >= since).group_by(XpEvent.user_id)
    )).all()
    return {uid: int(wx or 0) for uid, wx in rows}


@router.get("/me/gamification")
async def my_gamification(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    st = (await db.execute(select(UserStats).where(UserStats.user_id == user.id))).scalar_one_or_none()
    xp = st.xp if st else 0
    info = level_info(xp)
    # posición global entre alumnos
    better = (await db.execute(
        select(func.count()).select_from(UserStats).join(User, User.id == UserStats.user_id)
        .where(User.role == "alumno", UserStats.xp > xp)
    )).scalar_one()
    wk = await _week_xp_map(db)
    return {
        **info,
        "streak_current": st.streak_current if st else 0,
        "streak_longest": st.streak_longest if st else 0,
        "rank": int(better) + 1,
        "week_xp": wk.get(user.id, 0),
    }


@router.get("/leaderboard")
async def leaderboard(period: str = "all", limit: int = 50,
                      db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    limit = max(1, min(100, limit))
    out = []
    if period == "week":
        wk = await _week_xp_map(db)
        users = (await db.execute(select(User).where(User.role == "alumno"))).scalars().all()
        ranked = sorted(
            [(u, wk.get(u.id, 0)) for u in users if wk.get(u.id, 0) > 0],
            key=lambda t: t[1], reverse=True
        )[:limit]
        for i, (u, pts) in enumerate(ranked):
            out.append({"rank": i + 1, "user_id": str(u.id), "name": u.name,
                        "avatar_url": u.avatar_url, "xp": pts, "level": level_info(pts)["level"],
                        "title": level_info(pts)["title"], "is_me": u.id == user.id})
    else:
        rows = (await db.execute(
            select(UserStats, User).join(User, User.id == UserStats.user_id)
            .where(User.role == "alumno").order_by(UserStats.xp.desc()).limit(limit)
        )).all()
        for i, (st, u) in enumerate(rows):
            info = level_info(st.xp)
            out.append({"rank": i + 1, "user_id": str(u.id), "name": u.name,
                        "avatar_url": u.avatar_url, "xp": st.xp, "level": info["level"],
                        "title": info["title"], "is_me": u.id == user.id})
    return out
