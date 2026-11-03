import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FeedbackCreate(BaseModel):
    body: str
    results: str | None = None
    rating: int | None = None
    image_url: str | None = None


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    body: str
    results: str | None = None
    rating: int | None = None
    image_url: str | None = None
    status: str
    created_at: datetime
    author_name: str | None = None
    author_avatar: str | None = None
    author_bio: str | None = None
