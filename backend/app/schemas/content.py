import uuid
from pydantic import BaseModel, ConfigDict


# ───── Diplomado ─────
class DiplomaCreate(BaseModel):
    title: str
    slug: str | None = None
    description: str | None = None
    cover_url: str | None = None
    status: str = "draft"
    order: int = 0
    phase_id: uuid.UUID | None = None
    teacher_id: uuid.UUID | None = None
    badge_image_url: str | None = None
    hero_image_url: str | None = None
    intro_video_url: str | None = None
    has_routes: bool | None = None
    route_a_name: str | None = None
    route_b_name: str | None = None


class DiplomaUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    cover_url: str | None = None
    status: str | None = None
    order: int | None = None
    phase_id: uuid.UUID | None = None
    teacher_id: uuid.UUID | None = None
    badge_image_url: str | None = None
    hero_image_url: str | None = None
    intro_video_url: str | None = None
    has_routes: bool | None = None
    route_a_name: str | None = None
    route_b_name: str | None = None


class DiplomaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    slug: str
    description: str | None = None
    cover_url: str | None = None
    status: str
    order: int
    phase_id: uuid.UUID | None = None
    teacher_id: uuid.UUID | None = None
    badge_image_url: str | None = None
    hero_image_url: str | None = None
    intro_video_url: str | None = None
    has_routes: bool | None = None
    route_a_name: str | None = None
    route_b_name: str | None = None


# ───── Módulo ─────
class ModuleCreate(BaseModel):
    diploma_id: uuid.UUID
    title: str
    description: str | None = None
    cover_url: str | None = None
    route: str | None = None
    order: int = 0
    status: str = "draft"


class ModuleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_url: str | None = None
    route: str | None = None
    order: int | None = None
    status: str | None = None


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    diploma_id: uuid.UUID
    title: str
    description: str | None = None
    cover_url: str | None = None
    route: str | None = None
    order: int
    status: str


# ───── Lección ─────
class LessonCreate(BaseModel):
    module_id: uuid.UUID
    title: str
    slug: str | None = None
    videopress_url: str | None = None
    content: str | None = None
    duration_seconds: int = 0
    order: int = 0
    status: str = "draft"
    materials: list | None = None


class LessonUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    videopress_url: str | None = None
    content: str | None = None
    duration_seconds: int | None = None
    order: int | None = None
    status: str | None = None
    materials: list | None = None


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    module_id: uuid.UUID
    title: str
    slug: str | None = None
    videopress_url: str | None = None
    content: str | None = None
    duration_seconds: int
    order: int
    status: str
    materials: list | None = None
