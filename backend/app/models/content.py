import uuid
from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class Diploma(Base, TimestampMixin):
    __tablename__ = "diplomas"
    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft|published
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    phase_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("phases.id", ondelete="SET NULL"), index=True, nullable=True)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    badge_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)   # portada panorámica (fondo cabecera estilo Netflix)
    intro_video_url: Mapped[str | None] = mapped_column(String(600), nullable=True)  # video de presentación (VideoPress)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Module(Base, TimestampMixin):
    __tablename__ = "modules"
    id: Mapped[uuid.UUID] = uuid_pk()
    diploma_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("diplomas.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    id: Mapped[uuid.UUID] = uuid_pk()
    module_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str | None] = mapped_column(String(320), nullable=True)
    videopress_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    materials: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{nombre,url}]
