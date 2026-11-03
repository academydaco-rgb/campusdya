import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    body: str
    rating: int | None = None
    parent_id: uuid.UUID | None = None
    image_url: str | None = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    lesson_id: uuid.UUID
    user_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    body: str
    rating: int | None = None
    image_url: str | None = None
    status: str
    created_at: datetime
    author_name: str | None = None
