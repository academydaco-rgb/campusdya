import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    body: str
    parent_id: uuid.UUID | None = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    lesson_id: uuid.UUID
    user_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    body: str
    status: str
    created_at: datetime
    author_name: str | None = None
