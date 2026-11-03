import uuid
from datetime import datetime
from sqlalchemy import Integer, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class Enrollment(Base, TimestampMixin):
    """Permiso de un alumno sobre un diplomado."""
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "diploma_id", name="uq_enrollment"),)
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    diploma_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("diplomas.id", ondelete="CASCADE"), index=True, nullable=False)
    granted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LessonProgress(Base, TimestampMixin):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_lesson_progress"),)
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    lesson_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    seconds_watched: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
