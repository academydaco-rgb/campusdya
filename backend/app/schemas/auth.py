import uuid
from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    name: str
    avatar_url: str | None = None
    role: str
    status: str
    phone: str | None = None
    bio: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str | None = None      # si no viene, se genera temporal
    role: str = "alumno"
    phone: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    status: str | None = None
    phone: str | None = None
    bio: str | None = None
    password: str | None = None


class ImportUserRow(BaseModel):
    name: str
    email: EmailStr
    password: str | None = None
    diploma_slugs: list[str] = []    # diplomados a los que se inscribe


class ImportRequest(BaseModel):
    users: list[ImportUserRow]


class ImportResult(BaseModel):
    creados: int
    actualizados: int
    inscripciones: int
    errores: list[str] = []
