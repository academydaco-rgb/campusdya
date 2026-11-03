import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EnrollmentCreate(BaseModel):
    user_id: uuid.UUID
    diploma_id: uuid.UUID
    expires_at: datetime | None = None


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    diploma_id: uuid.UUID
    expires_at: datetime | None = None


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    lesson_id: uuid.UUID
    completed: bool
    completed_at: datetime | None = None
    seconds_watched: int
