import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class ScheduleEvent(Base, TimestampMixin):
    __tablename__ = "schedule_events"
    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    diploma_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("diplomas.id", ondelete="CASCADE"), nullable=True)
    module_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    live_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
