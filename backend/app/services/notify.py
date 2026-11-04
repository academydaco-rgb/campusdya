"""Envío masivo a alumnos activos (con aviso de cuota)."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.mailer import send_announcement


async def broadcast_announcement(db: AsyncSession, title: str, message: str, url: str) -> int:
    """Envía el comunicado a todos los alumnos activos. Devuelve cuántos se enviaron."""
    users = (await db.execute(
        select(User).where(User.role == "alumno", User.status == "active")
    )).scalars().all()
    sent = 0
    for u in users:
        if u.email and await send_announcement(u.email, u.name, title, message, url):
            sent += 1
    return sent
