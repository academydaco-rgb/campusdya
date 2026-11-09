"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedVideo from "@/components/ProtectedVideo";
import { buildSegments, pathModules, LabeledModule, RouteKey } from "@/lib/routes";
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
  const [pickRoute, setPickRoute] = useState<RouteKey | null>(null);

  useEffect(() => {
    if (!id) return;
    setL(null);
    setPickRoute(null);
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
    const r = await api.post<{ badge?: { name: string; icon?: string } | null }>(`/api/lessons/${id}/complete`);
    setL((p) => (p ? { ...p, completed: true } : p));
    setDiploma((d) => d ? { ...d, modules: d.modules.map((m) => ({ ...m, lessons: m.lessons.map((ls) => ls.id === id ? { ...ls, completed: true } : ls) })) } : d);
    try {
      const confetti = (await import("canvas-confetti")).default;
      if (r?.badge) {
        // Diplomado completado: celebración grande
        const end = Date.now() + 1200;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: ["#00ffff", "#4f7cff", "#f6b73c"] });
          confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: ["#00ffff", "#4f7cff", "#f6b73c"] });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      } else {
        confetti({ particleCount: 70, spread: 72, origin: { y: 0.7 }, colors: ["#00ffff", "#4f7cff", "#a855f7"] });
      }
    } catch { /* ignore */ }
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try { await api.post<CommentT>(`/api/lessons/${id}/comments`, { body: text.trim(), rating, image_url: img }); setText(""); setRating(5); setImg(null); await reloadComments(); }
    finally { setSaving(false); }
  }

  const hasRoutes = !!diploma?.has_routes;
  const curModule = diploma?.modules.find((m) => m.lessons.some((ls) => ls.id === id));
  const curRoute = curModule && (curModule.route === "A" || curModule.route === "B") ? (curModule.route as RouteKey) : null;
  const myRoute: RouteKey | null = hasRoutes ? (curRoute || ((diploma?.completed_lessons ?? 0) > 0 ? (diploma?.chosen_route || null) : null)) : null;
  const sideRoute: RouteKey = pickRoute || myRoute || "A";
  const segments = diploma ? buildSegments(diploma.modules, hasRoutes) : [];
  const flat = diploma ? pathModules(diploma.modules, hasRoutes, curRoute || myRoute || "A").flatMap((m) => m.lessons.map((ls) => ({ id: ls.id, title: ls.title }))) : [];
  const idx = flat.findIndex((x) => x.id === id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  if (error) return <div className="card" style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!l) return (
    <div className="dash">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ height: 22, width: 220 }} />
        <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9" }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
      </div>
    </div>
  );

  return (
    <div className="dash">
      {/* Principal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {diploma && <Link href={`/diplomado/${diploma.slug}`} className="muted" style={{ fontSize: 13 }}>← {diploma.title}</Link>}
        <h1 style={{ fontSize: 24 }}>{l.title}</h1>

        <div className="card" style={{ overflow: "hidden" }}>
          {l.videopress_url ? (
            <ProtectedVideo url={l.videopress_url} title={l.title} />
          ) : <div style={{ padding: 40, textAlign: "center" }} className="muted">Esta lección aún no tiene video.</div>}
        </div>

        {l.content && <div className="card" style={{ padding: 20, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{l.content}</div>}
        {Array.isArray(l.materials) && l.materials.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>📎 Archivos de la clase</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {l.materials.map((m, i) => (
                <a key={i} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 13 }} href={m.url} target="_blank" rel="noreferrer" download>
                  ⬇ {m.nombre || "Descargar"}
                </a>
              ))}
            </div>
          </div>
        )}

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
            segments.map((seg) => seg.kind === "common" ? (
              <SideModule key={seg.item.module.id} item={seg.item} currentId={id} />
            ) : (
              <div key={seg.key} className="side-fork">
                <div className="side-fork-t">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 6v12"/><path d="M18 10c0 4-6 4-11.5 8.5"/></svg>
                  Elige tu ruta
                </div>
                <div className="side-tabs">
                  {(["A", "B"] as const).map((rk) => (
                    <button key={rk} type="button" className={`side-tab ${rk.toLowerCase()}${sideRoute === rk ? " on" : ""}`} onClick={() => setPickRoute(rk)}
                      title={rk === "A" ? diploma.route_a_name || "Ruta A" : diploma.route_b_name || "Ruta B"}>
                      <b>{rk}</b><span>{rk === "A" ? diploma.route_a_name || "Ruta A" : diploma.route_b_name || "Ruta B"}</span>
                      {myRoute === rk && <i className="dot" aria-label="Estás en esta ruta" />}
                    </button>
                  ))}
                </div>
                {seg[sideRoute].map((it) => <SideModule key={it.module.id} item={it} currentId={id} />)}
                {seg[sideRoute].length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: "6px 10px" }}>Sin módulos en esta ruta.</div>}
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
      <div style={{ fontSize: 14, marginTop: 7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>{comment.body}</div>
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

function SideModule({ item, currentId }: { item: LabeledModule; currentId: string }) {
  const m = item.module;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: item.route === "A" ? "#7deeff" : item.route === "B" ? "#f0abfc" : "var(--muted)", padding: "8px 10px" }}>
        {item.route ? `${item.label}` : `Módulo ${Number(item.label)}`} · {m.title}
      </div>
                {item.module.lessons.map((ls) => {
                  const cur = ls.id === currentId;
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
  );
}
