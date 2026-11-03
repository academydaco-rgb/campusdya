import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.deps import require_admin, get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter(tags=["upload"])

_ALLOWED = {"image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp"}
_DIR = os.path.join(os.getenv("STATIC_DIR", "/app/static"), "uploads")


async def _save(file: UploadFile) -> dict:
    ext = _ALLOWED.get((file.content_type or "").lower())
    if not ext:
        raise HTTPException(status_code=400, detail="Formato no válido. Usa PNG, JPG o WEBP.")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen supera 8 MB.")
    os.makedirs(_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(_DIR, name), "wb") as f:
        f.write(data)
    return {"url": f"{settings.BACKEND_URL}/static/uploads/{name}"}


@router.post("/api/admin/upload")
async def upload_image_admin(file: UploadFile = File(...), admin: User = Depends(require_admin)):
    return await _save(file)


@router.post("/api/upload")
async def upload_image_user(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    return await _save(file)
