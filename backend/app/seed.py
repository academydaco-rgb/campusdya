"""Crea el admin inicial y las 4 fases si no existen. Lo llama el entrypoint."""
import asyncio
import secrets
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.catalog import Phase
from app.services.text import slugify


async def _seed_admin(db):
    email = (settings.SEED_ADMIN_EMAIL or "academydaco@gmail.com").lower().strip()
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        print(f"[seed] Admin ya existe: {email}")
        return
    pwd = settings.SEED_ADMIN_PASSWORD or secrets.token_urlsafe(12)
    db.add(User(email=email, name="Administrador", password_hash=hash_password(pwd),
                role="admin", status="active"))
    await db.commit()
    print(f"[seed] Admin creado: {email}")
    if not settings.SEED_ADMIN_PASSWORD:
        print(f"[seed] Contraseña temporal (cámbiala al entrar): {pwd}")


async def _seed_phases(db):
    fases = [
        ("Preparación y logística", "Alista tu operación: cuentas, proveedores y bases.", "🚀", "#22d3ee", 1),
        ("Creación", "Crea producto, oferta y activos: landing, imágenes y videos.", "🪐", "#a855f7", 2),
        ("Embudos de venta", "Arma y lanza tus campañas y embudos que convierten.", "🌌", "#f59e0b", 3),
        ("Optimización y escalamiento", "Mide, optimiza y escala lo que funciona.", "⭐", "#34d399", 4),
    ]
    creadas = 0
    for name, desc, icon, color, order in fases:
        slug = slugify(name)
        exists = (await db.execute(select(Phase).where(Phase.slug == slug))).scalar_one_or_none()
        if not exists:
            db.add(Phase(name=name, slug=slug, description=desc, icon=icon, color=color, order=order))
            creadas += 1
    await db.commit()
    print(f"[seed] Fases verificadas (4), nuevas: {creadas}")


async def main():
    async with AsyncSessionLocal() as db:
        await _seed_admin(db)
        await _seed_phases(db)


if __name__ == "__main__":
    asyncio.run(main())
