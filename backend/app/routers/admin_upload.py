import os
import uuid
from io import BytesIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
try:
    from PIL import Image
    _HAS_PIL = True
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()  # permite leer fotos .HEIC (iPhone/Mac)
    except Exception:
        pass
except Exception:
    _HAS_PIL = False
from app.core.deps import require_admin, get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter(tags=["upload"])

_ALLOWED = {"image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp",
            "image/heic": "heic", "image/heif": "heif", "image/gif": "gif"}
_DIR = os.path.join(os.getenv("STATIC_DIR", "/app/static"), "uploads")

_MAGIC = {"png": [b"\x89PNG"], "jpg": [b"\xff\xd8\xff"], "webp": [b"RIFF"], "pdf": [b"%PDF"],
          "zip": [b"PK"], "docx": [b"PK"], "xlsx": [b"PK"], "pptx": [b"PK"],
          "doc": [b"\xd0\xcf\x11\xe0"], "xls": [b"\xd0\xcf\x11\xe0"], "ppt": [b"\xd0\xcf\x11\xe0"]}


def _check_magic(data: bytes, ext: str) -> None:
    """Compara la firma real del archivo con su tipo declarado (bloquea archivos disfrazados)."""
    sigs = _MAGIC.get(ext)
    if sigs and not any(data.startswith(sg) for sg in sigs):
        raise HTTPException(status_code=400, detail="El archivo no coincide con su formato.")
    if ext == "webp" and data[8:12] != b"WEBP":
        raise HTTPException(status_code=400, detail="El archivo no coincide con su formato.")
    if ext in ("txt", "csv") and (b"<script" in data[:4096].lower() or b"<html" in data[:4096].lower()):
        raise HTTPException(status_code=400, detail="Contenido no permitido en el archivo.")


async def _save(file: UploadFile) -> dict:
    ct = (file.content_type or "").lower()
    ext = _ALLOWED.get(ct)
    data = await file.read()
    if len(data) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen supera 12 MB.")
    if ext:
        _check_magic(data, ext)
    # Convierte/optimiza a WebP. Pillow (con HEIF) lee JPG, PNG, WEBP, HEIC, GIF, BMP, TIFF…
    opt_data, opt_ext = _optimize_image(data, ct)
    if opt_ext != "webp" and not ext:
        raise HTTPException(status_code=400, detail="No se pudo leer la imagen. Usa JPG, PNG, WEBP o HEIC.")
    data, ext = opt_data, opt_ext
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
    _check_magic(data, ext)
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
        im.save(buf, format="WEBP", quality=80, method=4)
        return buf.getvalue(), "webp"
    except Exception:
        return data, _ALLOWED.get((content_type or "").lower(), "jpg")


async def _save_user_optimized(file: UploadFile) -> dict:
    ct = (file.content_type or "").lower()
    ext_in = _ALLOWED.get(ct)
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen supera 8 MB. Usa una más liviana.")
    if ext_in:
        _check_magic(data, ext_in)
    opt_data, opt_ext = _optimize_image(data, ct)
    if opt_ext != "webp" and not ext_in:
        raise HTTPException(status_code=400, detail="No se pudo leer la imagen. Usa JPG, PNG, WEBP o HEIC.")
    data, ext = opt_data, opt_ext
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
