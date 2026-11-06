import uuid
from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class Provider(Base, TimestampMixin):
    """Proveedores: videos tipo 'clases en vivo' (portada, descripción, enlace)."""
    __tablename__ = "providers"
    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    videopress_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(40), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)
