import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.content import Diploma, Module, Lesson
from app.services.routes import norm_route
from app.schemas.content import (
    DiplomaCreate, DiplomaUpdate, DiplomaOut,
    ModuleCreate, ModuleUpdate, ModuleOut,
    LessonCreate, LessonUpdate, LessonOut,
)
from app.services.text import slugify

router = APIRouter(prefix="/api/admin", tags=["admin-content"])


async def _get(db: AsyncSession, model, obj_id: uuid.UUID):
    obj = (await db.execute(select(model).where(model.id == obj_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} no encontrado")
    return obj


async def _unique_slug(db: AsyncSession, model, base: str, field: str = "slug") -> str:
    base = slugify(base)
    col = getattr(model, field)
    existing = set((await db.execute(select(col).where(col.like(f"{base}%")))).scalars().all())
    if base not in existing:
        return base
    i = 2
    while f"{base}-{i}" in existing:
        i += 1
    return f"{base}-{i}"


# ───────────── Diplomados ─────────────
@router.post("/diplomas", response_model=DiplomaOut)
async def create_diploma(data: DiplomaCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    slug = data.slug or data.title
    obj = Diploma(
        title=data.title,
        slug=await _unique_slug(db, Diploma, slug),
        description=data.description, cover_url=data.cover_url,
        status=data.status, order=data.order, phase_id=data.phase_id, created_by=admin.id,
        teacher_id=data.teacher_id, badge_image_url=data.badge_image_url,
        hero_image_url=data.hero_image_url, intro_video_url=data.intro_video_url,
        has_routes=bool(data.has_routes), route_a_name=data.route_a_name, route_b_name=data.route_b_name,
    )
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/diplomas", response_model=list[DiplomaOut])
async def list_diplomas(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    rows = (await db.execute(select(Diploma).order_by(Diploma.order, Diploma.created_at))).scalars().all()
    return rows


@router.get("/diplomas/{diploma_id}", response_model=DiplomaOut)
async def get_diploma(diploma_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await _get(db, Diploma, diploma_id)


@router.put("/diplomas/{diploma_id}", response_model=DiplomaOut)
async def update_diploma(diploma_id: uuid.UUID, data: DiplomaUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Diploma, diploma_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "has_routes":
            v = bool(v)
        setattr(obj, k, v)
    await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/diplomas/{diploma_id}")
async def delete_diploma(diploma_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Diploma, diploma_id)
    await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────────── Módulos ─────────────
@router.post("/modules", response_model=ModuleOut)
async def create_module(data: ModuleCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    await _get(db, Diploma, data.diploma_id)  # valida que el diplomado exista
    payload = data.model_dump()
    payload["route"] = norm_route(payload.get("route"))
    obj = Module(**payload)
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/modules", response_model=list[ModuleOut])
async def list_modules(diploma_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    rows = (await db.execute(select(Module).where(Module.diploma_id == diploma_id).order_by(Module.order, Module.created_at))).scalars().all()
    return rows


@router.put("/modules/{module_id}", response_model=ModuleOut)
async def update_module(module_id: uuid.UUID, data: ModuleUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Module, module_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "route":
            v = norm_route(v)
        setattr(obj, k, v)
    await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/modules/{module_id}")
async def delete_module(module_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Module, module_id)
    await db.delete(obj); await db.commit()
    return {"ok": True}


# ───────────── Lecciones ─────────────
@router.post("/lessons", response_model=LessonOut)
async def create_lesson(data: LessonCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    await _get(db, Module, data.module_id)
    payload = data.model_dump()
    payload["slug"] = data.slug or slugify(data.title)
    obj = Lesson(**payload)
    db.add(obj); await db.commit(); await db.refresh(obj)
    return obj


@router.get("/lessons", response_model=list[LessonOut])
async def list_lessons(module_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    rows = (await db.execute(select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order, Lesson.created_at))).scalars().all()
    return rows


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
async def update_lesson(lesson_id: uuid.UUID, data: LessonUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Lesson, lesson_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.commit(); await db.refresh(obj)
    return obj


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    obj = await _get(db, Lesson, lesson_id)
    await db.delete(obj); await db.commit()
    return {"ok": True}
