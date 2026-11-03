from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.setting import SiteSetting

router = APIRouter(prefix="/api", tags=["settings"])

_VIDEO_URL = "dashboard_video_url"
_VIDEO_COVER = "dashboard_video_cover"


class DashboardVideo(BaseModel):
    video_url: str | None = None
    cover_url: str | None = None


async def _get(db: AsyncSession, key: str) -> str | None:
    row = (await db.execute(select(SiteSetting).where(SiteSetting.key == key))).scalar_one_or_none()
    return row.value if row else None


async def _set(db: AsyncSession, key: str, value: str | None):
    row = (await db.execute(select(SiteSetting).where(SiteSetting.key == key))).scalar_one_or_none()
    if row:
        row.value = value
    else:
        db.add(SiteSetting(key=key, value=value))


@router.get("/settings/dashboard-video", response_model=DashboardVideo)
async def get_dashboard_video(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return DashboardVideo(video_url=await _get(db, _VIDEO_URL), cover_url=await _get(db, _VIDEO_COVER))


@router.put("/admin/settings/dashboard-video", response_model=DashboardVideo)
async def set_dashboard_video(data: DashboardVideo, db: AsyncSession = Depends(get_db), a: User = Depends(require_admin)):
    await _set(db, _VIDEO_URL, (data.video_url or None))
    await _set(db, _VIDEO_COVER, (data.cover_url or None))
    await db.commit()
    return DashboardVideo(video_url=await _get(db, _VIDEO_URL), cover_url=await _get(db, _VIDEO_COVER))
