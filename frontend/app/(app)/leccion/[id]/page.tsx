"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, LessonDetailT, FeedbackT } from "@/lib/api";

interface CommentT { id: string; body: string; author_name?: string | null; created_at: string; }

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [l, setL] = useState<LessonDetailT | null>(null);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<CommentT[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<LessonDetailT>(`/api/lessons/${id}`).then(setL).catch((e) => setError(e.message));
    api.get<CommentT[]>(`/api/lessons/${id}/comments`).then(setComments).catch(() => setComments([]));
  }, [id]);

  async function marcarCompletada() {
    await api.post(`/api/lessons/${id}/complete`);
    setL((prev) => (prev ? { ...prev, completed: true } : prev));
  }

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const c = await api.post<CommentT>(`/api/lessons/${id}/comments`, { body: text.trim() });
      setComments((prev) => [...prev, c]);
      setText("");
    } finally { setSaving(false); }
  }

  if (error) return <div className="card" style={{ padding: 24, color: "#fca5a5" }}>{error}</div>;
  if (!l) return <span className="muted">Cargando…</span>;

  return (
    <div className="grid" style={{ gap: 22, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{l.title}</h1>

      <div className="card" style={{ overflow: "hidden" }}>
        {l.videopress_url ? (
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe src={l.videopress_url} allow="fullscreen" allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center" }} className="muted">Esta lección aún no tiene video.</div>
        )}
      </div>

      {l.content && <div className="card" style={{ padding: 20, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{l.content}</div>}

      <div>
        <button className="btn btn-primary" onClick={marcarCompletada} disabled={l.completed}>
          {l.completed ? "✓ Completada" : "Marcar como completada"}
        </button>
      </div>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Comentarios</h2>
        <form onSubmit={enviarComentario} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un comentario…" />
          <button className="btn btn-primary" disabled={saving}>Enviar</button>
        </form>
        <div className="grid" style={{ gap: 10 }}>
          {comments.map((c) => (
            <div key={c.id} className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.author_name || "Alumno"}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{c.body}</div>
            </div>
          ))}
          {comments.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Sé el primero en comentar.</span>}
        </div>
      </section>
    </div>
  );
}
