import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    title: str
    body: str
    image_url: str | None = None
    link_url: str | None = None
    link_label: str | None = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    body: str
    image_url: str | None = None
    link_url: str | None = None
    link_label: str | None = None
    status: str
    created_at: datetime
