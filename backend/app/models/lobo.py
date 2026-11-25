import uuid
from datetime import date

from sqlalchemy import Integer, Date, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class LoboUsage(Base, TimestampMixin):
    """Contador de mensajes a LOBO ADS por alumno y día (límite diario)."""
    __tablename__ = "lobo_usage"
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    day: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_lobo_usage_user_day"),)
