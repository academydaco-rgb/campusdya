import uuid
from sqlalchemy import Text, String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base_mixin import TimestampMixin, uuid_pk


class Feedback(Base, TimestampMixin):
    """Opinión del alumno sobre la plataforma y sus resultados."""
    __tablename__ = "feedback"
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)              # cómo le pareció
    results: Mapped[str | None] = mapped_column(Text, nullable=True)     # resultados obtenidos
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)   # 1-5 opcional
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="visible", nullable=False)
