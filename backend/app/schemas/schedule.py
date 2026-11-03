import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ScheduleCreate(BaseModel):
    title: str
    description: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    module_id: uuid.UUID | None = None
    live_url: str | None = None


class ScheduleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    module_id: uuid.UUID | None = None
    live_url: str | None = None


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    module_id: uuid.UUID | None = None
    live_url: str | None = None
