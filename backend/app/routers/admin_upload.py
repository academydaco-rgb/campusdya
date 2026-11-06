import os
import uuid
from io import BytesIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
try:
    from PIL import Image
    _HAS_PIL = True
except Exception:
    _HAS_PIL = False
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


_ALLOWED_FILE = {
    "application/pdf": "pdf",
    "application/zip": "zip", "application/x-zip-compressed": "zip",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt", "text/csv": "csv",
    "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
}


async def _save_file(file: UploadFile) -> dict:
    ext = _ALLOWED_FILE.get((file.content_type or "").lower())
    if not ext:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa PDF, Office, imagen, CSV, TXT o ZIP.")
    data = await file.read()
    if len(data) > 30 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo supera 30 MB.")
    os.makedirs(_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(_DIR, name), "wb") as f:
        f.write(data)
    return {"url": f"{settings.BACKEND_URL}/static/uploads/{name}", "name": file.filename}


@router.post("/api/admin/upload-file")
async def upload_file_admin(file: UploadFile = File(...), admin: User = Depends(require_admin)):
    return await _save_file(file)


def _optimize_image(data: bytes, content_type: str) -> tuple[bytes, str]:
    """Baja el peso: redimensiona y convierte a WebP. Devuelve (bytes, ext)."""
    if not _HAS_PIL:
        return data, _ALLOWED.get((content_type or "").lower(), "jpg")
    try:
        im = Image.open(BytesIO(data))
        if im.mode == "P":
            im = im.convert("RGBA")
        MAX = 1600
        if max(im.size) > MAX:
            im.thumbnail((MAX, MAX))
        buf = BytesIO()
        im.save(buf, format="WEBP", quality=80, method=6)
        return buf.getvalue(), "webp"
    except Exception:
        return data, _ALLOWED.get((content_type or "").lower(), "jpg")


async def _save_user_optimized(file: UploadFile) -> dict:
    ext_in = _ALLOWED.get((file.content_type or "").lower())
    if not ext_in:
        raise HTTPException(status_code=400, detail="Formato no válido. Usa PNG, JPG o WEBP.")
    data = await file.read()
    if len(data) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen supera 3 MB. Usa una más liviana.")
    data, ext = _optimize_image(data, file.content_type)
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
    return await _save_user_optimized(file)
