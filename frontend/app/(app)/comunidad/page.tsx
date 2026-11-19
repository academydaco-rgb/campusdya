"use client";
import { useEffect, useRef, useState } from "react";
import { api, uploadImageUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import SectionHero from "@/components/SectionHero";
import { MessagesSquare, Heart, MessageCircle, Image as ImageIcon, X, Pin, Trash2, Send } from "lucide-react";

type Author = { id: string | null; name: string; avatar_url?: string | null; role: string };
type Post = {
  id: string; category: string; title?: string | null; body: string; image_url?: string | null;
  pinned: boolean; created_at: string; author: Author; likes: number; comments: number; liked: boolean;
};
type Cmt = { id: string; body: string; created_at: string; author: Author };

const CATS = ["General", "Mis ventas", "Preguntas", "Recursos", "Preséntate", "Logros"];
const AVS = ["#6d28d9,#00ffff", "#0891b2,#06b6d4", "#7c3aed,#d946ef", "#166534,#22e67a", "#be185d,#fb7185", "#b45309,#f6c453"];
function grad(seed: string) { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return `linear-gradient(135deg,${AVS[h % AVS.length]})`; }
function ago(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  const m = s / 60; if (m < 60) return `hace ${Math.floor(m)} min`;
  const h = m / 60; if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = h / 24; if (d < 7) return `hace ${Math.floor(d)} d`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function Avatar({ a, cls }: { a: Author; cls: string }) {
  return (
    <div className={cls} style={a.avatar_url ? { backgroundImage: `url(${a.avatar_url})` } : { background: grad(a.id || a.name) }}>
      {!a.avatar_url && a.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Comunidad() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [posts, setPosts] = useState<Post[]>([]);
  const [cat, setCat] = useState("Todo");
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(""); const [title, setTitle] = useState("");
  const [pcat, setPcat] = useState("General"); const [img, setImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [openC, setOpenC] = useState<Record<string, boolean>>({});
  const [cmts, setCmts] = useState<Record<string, Cmt[]>>({});
  const [cinput, setCinput] = useState<Record<string, string>>({});

  async function load() {
    const p = cat === "Todo" ? "" : `&category=${encodeURIComponent(cat)}`;
    try { setPosts(await api.get<Post[]>(`/api/community/posts?sort=${sort}${p}`)); } catch { setPosts([]); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cat, sort]);

  async function publish() {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await api.post("/api/community/posts", { body: body.trim(), category: pcat, title: title.trim() || null, image_url: img });
      setBody(""); setTitle(""); setImg(null); setPcat("General"); setOpen(false);
      await load();
    } catch { /* noop */ } finally { setBusy(false); }
  }

  async function pickImg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { setImg(await uploadImageUser(f)); } catch { /* noop */ }
  }

  async function like(p: Post) {
    try {
      const r = await api.post<{ liked: boolean; likes: number }>(`/api/community/posts/${p.id}/like`, {});
      setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, liked: r.liked, likes: r.likes } : x));
    } catch { /* noop */ }
  }

  async function toggleComments(p: Post) {
    const now = !openC[p.id];
    setOpenC((s) => ({ ...s, [p.id]: now }));
    if (now && !cmts[p.id]) {
      try { setCmts((s) => ({ ...s, [p.id]: [] })); const list = await api.get<Cmt[]>(`/api/community/posts/${p.id}/comments`); setCmts((s) => ({ ...s, [p.id]: list })); } catch { /* noop */ }
    }
  }

  async function sendComment(p: Post) {
    const txt = (cinput[p.id] || "").trim(); if (!txt) return;
    try {
      await api.post(`/api/community/posts/${p.id}/comments`, { body: txt });
      setCinput((s) => ({ ...s, [p.id]: "" }));
      const list = await api.get<Cmt[]>(`/api/community/posts/${p.id}/comments`);
      setCmts((s) => ({ ...s, [p.id]: list }));
      setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, comments: list.length } : x));
    } catch { /* noop */ }
  }

  async function del(p: Post) {
    if (!confirm("¿Borrar esta publicación?")) return;
    try { await api.del(`/api/community/posts/${p.id}`); setPosts((ps) => ps.filter((x) => x.id !== p.id)); } catch { /* noop */ }
  }
  async function pin(p: Post) {
    try { const r = await api.post<{ pinned: boolean }>(`/api/community/posts/${p.id}/pin`, {}); setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, pinned: r.pinned } : x)); await load(); } catch { /* noop */ }
  }

  return (
    <div className="cf-wrap">
      <SectionHero
        icon={<MessagesSquare size={14} />}
        badge="Comunidad"
        title="Comunidad"
        subtitle="Comparte tus avances, celebra tus ventas, haz preguntas y aprende con los demás emprendedores de Academy D&A."
      />

      {/* composer */}
      {!open ? (
        <div className="cf-comp" onClick={() => setOpen(true)}>
          {user && <Avatar a={{ id: user.id, name: user.name, avatar_url: user.avatar_url, role: user.role }} cls="cf-cav" />}
          <div className="cf-ph">Comparte algo con la comunidad…</div>
          <div className="cf-go"><Send size={15} /> Publicar</div>
        </div>
      ) : (
        <div className="cf-form">
          <div className="cf-form-head">
            <b>Nueva publicación</b>
            <button className="cf-x" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={18} /></button>
          </div>
          <div className="cf-cats">
            {CATS.map((c) => <button key={c} className={`cf-chip${pcat === c ? " on" : ""}`} onClick={() => setPcat(c)}>{c}</button>)}
          </div>
          <input className="cf-in" placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="cf-ta" placeholder="¿Qué quieres compartir?" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          {img && <div className="cf-prev" style={{ backgroundImage: `url(${img})` }}><button className="cf-x cf-prev-x" onClick={() => setImg(null)}><X size={16} /></button></div>}
          <div className="cf-form-foot">
            <button className="cf-attach" onClick={() => fileRef.current?.click()}><ImageIcon size={17} /> Imagen</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImg} />
            <button className="cf-pub" disabled={!body.trim() || busy} onClick={publish}>{busy ? "Publicando…" : "Publicar"}</button>
          </div>
        </div>
      )}

      {/* filtros */}
      <div className="cf-filters">
        {["Todo", ...CATS].map((c) => <button key={c} className={`cf-chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        <button className="cf-sort" onClick={() => setSort((s) => s === "recent" ? "top" : "recent")}>
          Ordenar: {sort === "recent" ? "Recientes" : "Populares"}
        </button>
      </div>

      {/* feed */}
      {posts.length === 0 && <div className="cf-empty">Aún no hay publicaciones. ¡Sé el primero en compartir!</div>}
      {posts.map((p) => (
        <div key={p.id} className={`cf-post${p.pinned ? " pin" : ""}`}>
          {p.pinned && <div className="cf-pin"><Pin size={11} /> Fijado</div>}
          <div className="cf-head">
            <Avatar a={p.author} cls="cf-av" />
            <div className="cf-who">
              <div className="cf-name">{p.author.name}{(p.author.role === "admin" || p.author.role === "instructor") && <span className="cf-role">Equipo</span>}</div>
              <div className="cf-meta">{ago(p.created_at)}</div>
            </div>
            <span className="cf-cat">{p.category}</span>
          </div>
          {p.title && <div className="cf-title">{p.title}</div>}
          <div className="cf-body">{p.body}</div>
          {p.image_url && <div className="cf-img" style={{ backgroundImage: `url(${p.image_url})` }} />}
          <div className="cf-foot">
            <button className={`cf-act${p.liked ? " liked" : ""}`} onClick={() => like(p)}>
              <Heart size={17} fill={p.liked ? "currentColor" : "none"} /> {p.likes}
            </button>
            <button className="cf-act" onClick={() => toggleComments(p)}><MessageCircle size={17} /> {p.comments}</button>
            {(isAdmin) && <button className="cf-act cf-admin" onClick={() => pin(p)}><Pin size={15} /></button>}
            {(isAdmin || p.author.id === user?.id) && <button className="cf-act cf-admin" onClick={() => del(p)}><Trash2 size={15} /></button>}
          </div>
          {openC[p.id] && (
            <div className="cf-cmts">
              {(cmts[p.id] || []).map((c) => (
                <div key={c.id} className="cf-cmt">
                  <Avatar a={c.author} cls="cf-ca" />
                  <div className="cf-cb"><div className="cf-cn">{c.author.name} <span className="cf-ct-time">· {ago(c.created_at)}</span></div><div className="cf-ct">{c.body}</div></div>
                </div>
              ))}
              <div className="cf-cbox">
                <input placeholder="Escribe un comentario…" value={cinput[p.id] || ""}
                  onChange={(e) => setCinput((s) => ({ ...s, [p.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") sendComment(p); }} />
                <button onClick={() => sendComment(p)}><Send size={15} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
