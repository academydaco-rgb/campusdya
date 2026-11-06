import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ───── Fase ─────
class PhaseCreate(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    order: int = 0


class PhaseUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    order: int | None = None


class PhaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    order: int


# ───── Profesor ─────
class TeacherCreate(BaseModel):
    name: str
    bio: str | None = None
    photo_url: str | None = None
    whatsapp: str | None = None
    order: int = 0
    status: str = "active"


class TeacherUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    whatsapp: str | None = None
    order: int | None = None
    status: str | None = None


class TeacherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    bio: str | None = None
    photo_url: str | None = None
    whatsapp: str | None = None
    order: int
    status: str


# ───── Clase en vivo (grabada) ─────
class LiveClassCreate(BaseModel):
    title: str
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    happened_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    phase_id: uuid.UUID | None = None
    status: str = "published"


class LiveClassUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    happened_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    phase_id: uuid.UUID | None = None
    status: str | None = None


class LiveClassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    happened_at: datetime | None = None
    diploma_id: uuid.UUID | None = None
    phase_id: uuid.UUID | None = None
    status: str


class CasoExitoCreate(BaseModel):
    title: str
    description: str | None = None
    videopress_url: str | None = None
    external_url: str | None = None
    cover_url: str | None = None
    order: int = 0
    status: str = "published"


class CasoExitoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    videopress_url: str | None = None
    external_url: str | None = None
    cover_url: str | None = None
    order: int | None = None
    status: str | None = None


class CasoExitoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None = None
    videopress_url: str | None = None
    external_url: str | None = None
    cover_url: str | None = None
    order: int
    status: str


class ToolCreate(BaseModel):
    title: str
    image_url: str | None = None
    link_url: str | None = None
    link_label: str | None = None
    order: int = 0
    status: str = "published"


class ToolUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    link_url: str | None = None
    link_label: str | None = None
    order: int | None = None
    status: str | None = None


class ToolOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    image_url: str | None = None
    link_url: str | None = None
    link_label: str | None = None
    order: int
    status: str
