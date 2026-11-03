from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SiteSetting(Base):
    """Ajustes globales del sitio (clave/valor)."""
    __tablename__ = "site_settings"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
