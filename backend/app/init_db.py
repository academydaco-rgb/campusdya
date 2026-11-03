"""Crea todas las tablas declaradas en los modelos. Lo llama el entrypoint."""
import asyncio
from app.core.database import engine, Base
from app import models  # noqa: F401  (registra todos los modelos en Base.metadata)


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[init_db] Tablas creadas/verificadas OK")


if __name__ == "__main__":
    asyncio.run(main())
