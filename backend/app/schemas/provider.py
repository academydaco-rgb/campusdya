import uuid
from pydantic import BaseModel, ConfigDict


class ProviderCreate(BaseModel):
    title: str
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    whatsapp: str | None = None
    order: int = 0
    status: str = "published"


class ProviderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    whatsapp: str | None = None
    order: int | None = None
    status: str | None = None


class ProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None = None
    videopress_url: str | None = None
    cover_url: str | None = None
    whatsapp: str | None = None
    order: int
    status: str
