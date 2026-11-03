import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class Phase(Base, TimestampMixin):
    """Las 4 fases del programa. Agrupan diplomados (ruta de ejecución)."""
    __tablename__ = "phases"
    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)   # emoji/planeta
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)   # color del "planeta"
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Teacher(Base, TimestampMixin):
    __tablename__ = "teachers"
    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(40), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)


class LiveClass(Base, TimestampMixin):
    """Clases en vivo grabadas (el admin las sube; el alumno las ve si faltó)."""
    __tablename__ = "live_classes"
    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    videopress_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    happened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    diploma_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("diplomas.id", ondelete="SET NULL"), nullable=True)
    phase_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("phases.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)
