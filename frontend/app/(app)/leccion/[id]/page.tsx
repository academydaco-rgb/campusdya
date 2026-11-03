"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, uploadImageUser, LessonDetailT, DiplomaDetailT } from "@/lib/api";

interface CommentT { id: string; body: string; rating?: number | null; image_url?: string | null; parent_id?: string | null; author_name?: string | null; created_at: string; }

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onClick={onPick ? () => onPick(n) : undefined}
          style={{ cursor: onPick ? "pointer" : "default", color: n <= value ? "var(--f3)" : "var(--muted-soft)", fontSize: onPick ? 22 : 13 }}>★</span>
      ))}
    </span>
  );
}

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const [l, setL] = useState<LessonDetailT | null>(null);
  const [diploma, setDiploma] = useState<DiplomaDetailT | null>(null);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<CommentT[]>([]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [img, setImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setL(null);
    api.get<LessonDetailT>(`/api/lessons/${id}`).then((lesson) => {
      setL(lesson);
      if (lesson.diploma_slug) api.get<DiplomaDetailT>(`/api/diplomas/${lesson.diploma_slug}`).then(setDiploma).catch(() => {});
    }).catch((e) => setError(e.message));
    api.get<CommentT[]>(`/api/lessons/${id}/comments`).then(setComments).catch(() => setComments([]));
  }, [id]);

  async function reloadComments() {
    try { setComments(await api.get<CommentT[]>(`/api/lessons/${id}/comments`)); } catch { /* ignore */ }
  }

  async function completar() {
    await api.post(`/api/lessons/${id}/complete`);
    setL((p) => (p ? { ...p, completed: true } : p));
    setDiploma((d) => d ? { ...d, modules: d.modules.map((m) => ({ ...m, lessons: m.lessons.map((ls) => ls.id === id ? { ...ls, completed: true } : ls) })) } : d);
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try { await api.post<CommentT>(`/api/lessons/${id}/comments`, { body: text.trim(), rating, image_url: img }); setText(""); setRating(5); setImg(null); await reloadComments(); }
    finally { setSaving(false); }
  }

  const flat = diploma ? diploma.modules.flatMap((m) => m.lessons.map((ls) => ({ id: ls.id, title: ls.title }))) : [];
  const idx = flat.findIndex((x) => x.id === id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  if (error) return <div className="card" style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!l) return <span className="muted">Cargando…</span>;

  return (
    <div className="dash">
      {/* Principal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {diploma && <Link href={`/diplomado/${diploma.slug}`} className="muted" style={{ fontSize: 13 }}>← {diploma.title}</Link>}
        <h1 style={{ fontSize: 24 }}>{l.title}</h1>

        <div className="card" style={{ overflow: "hidden" }}>
          {l.videopress_url ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe src={l.videopress_url} allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
          ) : <div style={{ padding: 40, textAlign: "center" }} className="muted">Esta lección aún no tiene video.</div>}
        </div>

        {l.content && <div className="card" style={{ padding: 20, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{l.content}</div>}

        {/* Navegación */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {prev ? <Link href={`/leccion/${prev.id}`} className="btn btn-ghost">← Anterior</Link> : <span />}
          <button className="btn btn-primary" onClick={completar} disabled={l.completed}>{l.completed ? "✓ Completada" : "Marcar como completada"}</button>
          {next ? <Link href={`/leccion/${next.id}`} className="btn btn-ghost" style={{ marginLeft: "auto" }}>Siguiente →</Link> : <span style={{ marginLeft: "auto" }} />}
        </div>

        {/* Comunidad: calificación, imágenes y respuestas */}
        <section>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Comunidad · califica y comenta</h2>
          <form onSubmit={enviar} className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="muted" style={{ fontSize: 13 }}>Tu calificación:</span><Stars value={rating} onPick={setRating} /></div>
            <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu comentario…" rows={2} style={{ resize: "vertical" }} />
            {img && <div style={{ position: "relative", width: 160 }}><img src={img} alt="" style={{ width: 160, borderRadius: 10, display: "block" }} /><button type="button" onClick={() => setImg(null)} className="btn btn-ghost" style={{ position: "absolute", top: 6, right: 6, padding: "2px 8px", fontSize: 12 }}>✕</button></div>}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ImgPick onPick={setImg} />
              <span style={{ flex: 1 }} />
              <button className="btn btn-primary" disabled={saving}>Publicar</button>
            </div>
          </form>
          <div className="grid" style={{ gap: 12, marginTop: 14 }}>
            {comments.filter((c) => !c.parent_id).map((c) => (
              <CommentCard key={c.id} comment={c} replies={comments.filter((r) => r.parent_id === c.id)} lessonId={id} onChange={reloadComments} />
            ))}
            {comments.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Sé el primero en comentar.</span>}
          </div>
        </section>
      </div>

      {/* Parrilla de contenido */}
      <aside>
        <div className="wh"><h2>Contenido</h2></div>
        <div className="card" style={{ padding: 10, position: "sticky", top: 20 }}>
          {!diploma ? <div style={{ padding: 12 }} className="muted">…</div> :
            diploma.modules.map((m, mi) => (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", padding: "8px 10px" }}>Módulo {mi + 1} · {m.title}</div>
                {m.lessons.map((ls) => {
                  const cur = ls.id === id;
                  return (
                    <Link key={ls.id} href={`/leccion/${ls.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 9, fontSize: 13,
                        background: cur ? "var(--grad-soft)" : "transparent", color: cur ? "#fff" : "var(--muted)", fontWeight: cur ? 700 : 500 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 10, flexShrink: 0,
                        background: ls.completed ? "var(--f4)" : "transparent", color: ls.completed ? "#04110b" : "var(--muted)", border: ls.completed ? "none" : "1px solid var(--line-2)" }}>
                        {ls.completed ? "✓" : ""}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ls.title}</span>
                      {cur && <span style={{ color: "var(--cyan)" }}>▶</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}

function ImgPick({ onPick }: { onPick: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onPick(await uploadImageUser(f)); } catch { /* ignore */ } finally { setBusy(false); e.target.value = ""; }
  }
  return (
    <label className="btn btn-ghost" style={{ fontSize: 13, cursor: "pointer" }}>
      {busy ? "Subiendo…" : "📷 Imagen"}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} style={{ display: "none" }} />
    </label>
  );
}

function CommentCard({ comment, replies, lessonId, onChange }: { comment: CommentT; replies: CommentT[]; lessonId: string; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function responder(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try { await api.post(`/api/lessons/${lessonId}/comments`, { body: text.trim(), parent_id: comment.id, image_url: img }); setText(""); setImg(null); setOpen(false); onChange(); }
    finally { setSaving(false); }
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--grad-soft)", fontSize: 12, fontWeight: 700 }}>{(comment.author_name || "A").charAt(0).toUpperCase()}</span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{comment.author_name || "Alumno"}</span>
        {comment.rating ? <Stars value={comment.rating} /> : null}
      </div>
      <div style={{ fontSize: 14, marginTop: 7, whiteSpace: "pre-wrap" }}>{comment.body}</div>
      {comment.image_url && <img src={comment.image_url} alt="" style={{ marginTop: 10, maxWidth: "100%", borderRadius: 10, display: "block" }} />}
      <div style={{ marginTop: 8 }}>
        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setOpen((o) => !o)}>↳ Responder</button>
      </div>

      {open && (
        <form onSubmit={responder} style={{ display: "grid", gap: 8, marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--line-2)" }}>
          <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe una respuesta…" rows={2} style={{ resize: "vertical" }} />
          {img && <img src={img} alt="" style={{ width: 140, borderRadius: 10 }} />}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ImgPick onPick={setImg} />
            <span style={{ flex: 1 }} />
            <button className="btn btn-primary" style={{ padding: "7px 14px", fontSize: 13 }} disabled={saving}>Responder</button>
          </div>
        </form>
      )}

      {replies.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 10, paddingLeft: 14, borderLeft: "2px solid var(--line)" }}>
          {replies.map((r) => (
            <div key={r.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(255,255,255,.06)", fontSize: 11, fontWeight: 700 }}>{(r.author_name || "A").charAt(0).toUpperCase()}</span>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{r.author_name || "Alumno"}</span>
              </div>
              <div style={{ fontSize: 13.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{r.body}</div>
              {r.image_url && <img src={r.image_url} alt="" style={{ marginTop: 8, maxWidth: "100%", borderRadius: 9, display: "block" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

