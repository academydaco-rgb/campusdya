from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, admin_content, admin_users, student, admin_catalog, catalog_public


@asynccontextmanager
async def lifespan(app: FastAPI):
    # El esquema y el seed los corre el entrypoint. Aquí solo arranque.
    yield


app = FastAPI(title="Academia D&A API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "academia-da"}


app.include_router(auth.router)
app.include_router(admin_content.router)
app.include_router(admin_users.router)
app.include_router(student.router)
app.include_router(admin_catalog.router)
app.include_router(catalog_public.router)
