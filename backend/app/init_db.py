"""Crea tablas y aplica migraciones ligeras idempotentes. Lo llama el entrypoint."""
import asyncio
from sqlalchemy import text
from app.core.database import engine, Base
from app import models  # noqa: F401

_MIGRATIONS = [
    "ALTER TABLE modules ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)",
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS rating INTEGER",
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)",
    "ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)",
    "ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS teacher_id UUID",
    "ALTER TABLE diplomas ADD COLUMN IF NOT EXISTS teacher_id UUID",
    "ALTER TABLE diplomas ADD COLUMN IF NOT EXISTS badge_image_url VARCHAR(500)",
    "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)",
    "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS teacher_id UUID",
]


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for sql in _MIGRATIONS:
            await conn.execute(text(sql))
    print("[init_db] Tablas + migraciones OK")


if __name__ == "__main__":
    asyncio.run(main())
