"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, LessonDetailT, DiplomaDetailT } from "@/lib/api";

interface CommentT { id: string; body: string; rating?: number | null; author_name?: string | null; created_at: string; }

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

  async function completar() {
    await api.post(`/api/lessons/${id}/complete`);
    setL((p) => (p ? { ...p, completed: true } : p));
    setDiploma((d) => d ? { ...d, modules: d.modules.map((m) => ({ ...m, lessons: m.lessons.map((ls) => ls.id === id ? { ...ls, completed: true } : ls) })) } : d);
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try { const c = await api.post<CommentT>(`/api/lessons/${id}/comments`, { body: text.trim(), rating }); setComments((p) => [...p, c]); setText(""); setRating(5); }
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

        {/* Comentarios + calificación */}
        <section>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Califica y comenta esta clase</h2>
          <form onSubmit={enviar} className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="muted" style={{ fontSize: 13 }}>Tu calificación:</span><Stars value={rating} onPick={setRating} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu comentario…" />
              <button className="btn btn-primary" disabled={saving}>Enviar</button>
            </div>
          </form>
          <div className="grid" style={{ gap: 10, marginTop: 14 }}>
            {comments.map((c) => (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author_name || "Alumno"}</span>
                  {c.rating ? <Stars value={c.rating} /> : null}
                </div>
                <div style={{ fontSize: 14, marginTop: 5 }}>{c.body}</div>
              </div>
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
