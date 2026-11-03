"use client";
import { useEffect, useState } from "react";
import { api, FeedbackT } from "@/lib/api";

interface CommentModT { id: string; body: string; status: string; author_name?: string | null; }

export default function Moderacion() {
  const [comments, setComments] = useState<CommentModT[]>([]);
  const [feedback, setFeedback] = useState<FeedbackT[]>([]);
  async function load() {
    setComments(await api.get<CommentModT[]>("/api/admin/comments"));
    setFeedback(await api.get<FeedbackT[]>("/api/admin/feedback"));
  }
  useEffect(() => { load().catch(() => {}); }, []);
  async function togC(id: string, status: string) { await api.put(`/api/admin/comments/${id}?status=${status}`); await load(); }
  async function delC(id: string) { await api.del(`/api/admin/comments/${id}`); await load(); }
  async function togF(id: string, status: string) { await api.put(`/api/admin/feedback/${id}?status=${status}`); await load(); }
  async function delF(id: string) { await api.del(`/api/admin/feedback/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 26 }}>
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Comentarios ({comments.length})</h2>
        <div className="grid" style={{ gap: 8 }}>
          {comments.map((c) => (
            <div key={c.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, opacity: c.status === "hidden" ? .5 : 1 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14 }}>{c.body}</div><div className="muted" style={{ fontSize: 12 }}>{c.author_name}</div></div>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => togC(c.id, c.status === "hidden" ? "visible" : "hidden")}>{c.status === "hidden" ? "Mostrar" : "Ocultar"}</button>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => delC(c.id)}>✕</button>
            </div>
          ))}
          {comments.length === 0 && <span className="muted">Sin comentarios.</span>}
        </div>
      </section>
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Feedback de la plataforma ({feedback.length})</h2>
        <div className="grid" style={{ gap: 8 }}>
          {feedback.map((f) => (
            <div key={f.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, opacity: f.status === "hidden" ? .5 : 1 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14 }}>{f.body}</div><div className="muted" style={{ fontSize: 12 }}>{f.author_name} · {"★".repeat(f.rating || 5)}</div></div>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => togF(f.id, f.status === "hidden" ? "visible" : "hidden")}>{f.status === "hidden" ? "Mostrar" : "Ocultar"}</button>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => delF(f.id)}>✕</button>
            </div>
          ))}
          {feedback.length === 0 && <span className="muted">Sin feedback.</span>}
        </div>
      </section>
    </div>
  );
}
