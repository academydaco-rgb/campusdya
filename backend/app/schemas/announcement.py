import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    image_url: str | None = None
    visible_days: int | None = None   # vigencia en días (None = permanente)


class AnnouncementUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    image_url: str | None = None
    status: str | None = None
    visible_days: int | None = None


class AnnouncementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    body: str
    image_url: str | None = None
    status: str
    starts_at: datetime
    expires_at: datetime | None = None
    created_at: datetime
