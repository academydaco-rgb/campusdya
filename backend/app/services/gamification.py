"""Gamificación: XP, niveles y racha de días activos (hora Colombia)."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.gamification import UserStats, XpEvent

try:
    from zoneinfo import ZoneInfo
    BOGOTA = ZoneInfo("America/Bogota")
except Exception:  # pragma: no cover
    BOGOTA = timezone(timedelta(hours=-5))

# XP por acción
XP_VIEW_LESSON = 5
XP_COMPLETE_LESSON = 20
XP_COMPLETE_DIPLOMA = 200
XP_POST = 10
XP_COMMENT = 4

# Niveles: (xp acumulado para alcanzarlo, título)
LEVELS = [
    (0, "Aprendiz"),
    (100, "Vendedor"),
    (300, "Emprendedor"),
    (600, "Estratega"),
    (1000, "Experto"),
    (1600, "Mentor"),
    (2400, "Maestro"),
    (3500, "Leyenda"),
]
_STEP = 1500  # xp por nivel más allá del último definido


def level_info(xp: int) -> dict:
    xp = max(0, int(xp or 0))
    lvl, title, base, nxt = 1, LEVELS[0][1], 0, None
    for i, (thr, name) in enumerate(LEVELS):
        if xp >= thr:
            lvl, title, base = i + 1, name, thr
        else:
            nxt = thr
            break
    if nxt is None:
        extra = (xp - LEVELS[-1][0]) // _STEP
        lvl = len(LEVELS) + extra
        base = LEVELS[-1][0] + extra * _STEP
        nxt = base + _STEP
        title = "Leyenda"
    into, need = xp - base, max(1, nxt - base)
    return {"level": lvl, "title": title, "xp": xp, "into": into,
            "need": need, "pct": min(100, round(100 * into / need)), "next_at": nxt}


async def _stats(db: AsyncSession, user_id) -> UserStats:
    st = (await db.execute(select(UserStats).where(UserStats.user_id == user_id))).scalar_one_or_none()
    if not st:
        st = UserStats(user_id=user_id, xp=0, streak_current=0, streak_longest=0, streak_last=None)
        db.add(st)
        await db.flush()
    return st


async def award(db: AsyncSession, user_id, amount: int, reason: str) -> UserStats:
    st = await _stats(db, user_id)
    st.xp = (st.xp or 0) + int(amount)
    db.add(XpEvent(user_id=user_id, amount=int(amount), reason=reason[:80]))
    return st


async def touch_streak(db: AsyncSession, user_id) -> UserStats:
    st = await _stats(db, user_id)
    today = datetime.now(BOGOTA).date()
    tkey = today.strftime("%Y-%m-%d")
    if st.streak_last == tkey:
        return st
    ykey = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    st.streak_current = (st.streak_current or 0) + 1 if st.streak_last == ykey else 1
    st.streak_last = tkey
    if st.streak_current > (st.streak_longest or 0):
        st.streak_longest = st.streak_current
    return st


async def activity(db: AsyncSession, user_id, amount: int, reason: str) -> UserStats:
    """Otorga XP y actualiza la racha. El commit lo hace quien llama."""
    try:
        await award(db, user_id, amount, reason)
        await touch_streak(db, user_id)
    except Exception:
        pass
    return await _stats(db, user_id)
