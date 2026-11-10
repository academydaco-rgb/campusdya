import os
import mimetypes

# El contenedor base no tiene .webp/.heic en su base de MIME y Starlette los
# servía como text/plain, por eso el navegador no mostraba las imágenes.
for _ext, _mt in ((".webp", "image/webp"), (".heic", "image/heic"),
                   (".heif", "image/heif"), (".jpg", "image/jpeg"),
                   (".jpeg", "image/jpeg"), (".png", "image/png")):
    mimetypes.add_type(_mt, _ext)

_IMG_TYPES = {".webp": "image/webp", ".heic": "image/heic", ".heif": "image/heif",
              ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
              ".gif": "image/gif", ".svg": "image/svg+xml"}
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.core.hardening import SecurityHeadersMiddleware
from app.routers import auth, admin_content, admin_users, student, admin_catalog, catalog_public, admin_upload, announcements, settings as settings_router, certificates, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # El esquema y el seed los corre el entrypoint. Aquí solo arranque.
    yield


_DOCS = os.getenv("API_DOCS", "0") == "1"   # documentación interactiva apagada en producción
app = FastAPI(title="Academia D&A API", version="0.1.0", lifespan=lifespan,
              docs_url="/docs" if _DOCS else None, redoc_url=None,
              openapi_url="/openapi.json" if _DOCS else None)

if settings.SECRET_KEY in ("", "cambia-esto-en-produccion", "genera-una-clave-larga-aleatoria") or len(settings.SECRET_KEY) < 32:
    print("[SEGURIDAD] ⚠️  SECRET_KEY débil o por defecto. Pon una clave aleatoria de 64+ caracteres en .env")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=600)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "academia-da"}


class CachedStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        resp = await super().get_response(path, scope)
        try:
            resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            _ext = os.path.splitext(str(path))[1].lower()
            if _ext in _IMG_TYPES:
                resp.headers["Content-Type"] = _IMG_TYPES[_ext]
        except Exception:
            pass
        return resp


_STATIC_DIR = os.getenv("STATIC_DIR", "/app/static")
try:
    os.makedirs(os.path.join(_STATIC_DIR, "uploads"), exist_ok=True)
except Exception:
    pass
app.mount("/static", CachedStaticFiles(directory=_STATIC_DIR, check_dir=False), name="static")

app.include_router(auth.router)
app.include_router(admin_content.router)
app.include_router(admin_users.router)
app.include_router(student.router)
app.include_router(admin_catalog.router)
app.include_router(catalog_public.router)
app.include_router(admin_upload.router)
app.include_router(announcements.router)
app.include_router(settings_router.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
