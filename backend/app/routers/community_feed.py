import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.community import Post, PostLike, PostComment
from app.services import gamification as gam

router = APIRouter(prefix="/api/community", tags=["community"])

CATEGORIES = ["General", "Mis ventas", "Preguntas", "Recursos", "Preséntate", "Logros"]


class PostCreate(BaseModel):
    body: str
    category: str = "General"
    title: str | None = None
    image_url: str | None = None


class CommentCreate(BaseModel):
    body: str


def _author(u: User | None):
    if not u:
        return {"id": None, "name": "Usuario", "avatar_url": None, "role": "alumno"}
    return {"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url, "role": u.role}


@router.get("/categories")
async def categories(user: User = Depends(get_current_user)):
    return CATEGORIES


@router.get("/posts")
async def list_posts(category: str | None = None, sort: str = "recent", limit: int = 50,
                     db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    limit = max(1, min(100, limit))
    q = select(Post).where(Post.status == "visible")
    if category and category != "Todo":
        q = q.where(Post.category == category)
    posts = (await db.execute(q)).scalars().all()
    if not posts:
        return []
    ids = [p.id for p in posts]
    umap = {u.id: u for u in (await db.execute(select(User).where(User.id.in_([p.user_id for p in posts])))).scalars().all()}
    lc = dict((await db.execute(select(PostLike.post_id, func.count()).where(PostLike.post_id.in_(ids)).group_by(PostLike.post_id))).all())
    cc = dict((await db.execute(select(PostComment.post_id, func.count()).where(PostComment.post_id.in_(ids), PostComment.status == "visible").group_by(PostComment.post_id))).all())
    mine = set((await db.execute(select(PostLike.post_id).where(PostLike.user_id == user.id, PostLike.post_id.in_(ids)))).scalars().all())
    out = []
    for p in posts:
        out.append({
            "id": str(p.id), "category": p.category, "title": p.title, "body": p.body,
            "image_url": p.image_url, "pinned": bool(p.pinned), "created_at": p.created_at.isoformat(),
            "author": _author(umap.get(p.user_id)),
            "likes": int(lc.get(p.id, 0)), "comments": int(cc.get(p.id, 0)),
            "liked": p.id in mine,
        })
    if sort == "top":
        out.sort(key=lambda x: (x["pinned"], x["likes"], x["created_at"]), reverse=True)
    else:
        out.sort(key=lambda x: (x["pinned"], x["created_at"]), reverse=True)
    return out[:limit]


@router.post("/posts")
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    body = (data.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Escribe algo para publicar")
    cat = data.category if data.category in CATEGORIES else "General"
    p = Post(user_id=user.id, category=cat, title=(data.title or None), body=body, image_url=(data.image_url or None))
    db.add(p)
    if user.role not in ("admin", "instructor"):
        await gam.activity(db, user.id, gam.XP_POST, "post")
    await db.commit()
    await db.refresh(p)
    return {"id": str(p.id), "ok": True}


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    existing = (await db.execute(select(PostLike).where(PostLike.user_id == user.id, PostLike.post_id == post_id))).scalar_one_or_none()
    if existing:
        await db.execute(delete(PostLike).where(PostLike.id == existing.id))
        liked = False
    else:
        db.add(PostLike(user_id=user.id, post_id=post_id))
        liked = True
    await db.commit()
    n = (await db.execute(select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id))).scalar_one()
    return {"liked": liked, "likes": int(n)}


@router.get("/posts/{post_id}/comments")
async def list_comments(post_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(select(PostComment).where(PostComment.post_id == post_id, PostComment.status == "visible").order_by(PostComment.created_at))).scalars().all()
    umap = {u.id: u for u in (await db.execute(select(User).where(User.id.in_([c.user_id for c in rows] or [uuid.uuid4()])))).scalars().all()}
    return [{"id": str(c.id), "body": c.body, "created_at": c.created_at.isoformat(), "author": _author(umap.get(c.user_id))} for c in rows]


@router.post("/posts/{post_id}/comments")
async def add_comment(post_id: uuid.UUID, data: CommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    body = (data.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Escribe un comentario")
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    c = PostComment(post_id=post_id, user_id=user.id, body=body)
    db.add(c)
    if user.role not in ("admin", "instructor"):
        await gam.activity(db, user.id, gam.XP_COMMENT, "comment")
    await db.commit()
    await db.refresh(c)
    return {"id": str(c.id), "ok": True}


@router.delete("/posts/{post_id}")
async def delete_post(post_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="No encontrada")
    if post.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="No puedes borrar esta publicación")
    await db.execute(delete(Post).where(Post.id == post_id))
    await db.commit()
    return {"ok": True}


@router.post("/posts/{post_id}/pin")
async def pin_post(post_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="No encontrada")
    post.pinned = not post.pinned
    await db.commit()
    return {"ok": True, "pinned": post.pinned}
