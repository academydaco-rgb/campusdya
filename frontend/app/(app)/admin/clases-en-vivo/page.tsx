"use client";
import { useEffect, useState } from "react";
import { api, LiveClassT } from "@/lib/api";

export default function AdminLive() {
  const [items, setItems] = useState<LiveClassT[]>([]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [video, setVideo] = useState(""); const [when, setWhen] = useState("");
  async function load() { setItems(await api.get<LiveClassT[]>("/api/admin/live-classes")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    await api.post("/api/admin/live-classes", { title: title.trim(), description: desc.trim() || null, videopress_url: video.trim() || null, happened_at: when || null });
    setTitle(""); setDesc(""); setVideo(""); setWhen(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/live-classes/${id}`); await load(); }
  return (
    <div className="grid" style={{ gap: 18 }}>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label className="label">Fecha</label><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
        </div>
        <div><label className="label">URL del video (VideoPress)</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn btn-primary">Agregar clase en vivo</button>
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {items.map((c) => (
          <div key={c.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, fontWeight: 700 }}>{c.title}</span>
            {c.videopress_url ? <span className="badge-pill" style={{ color: "var(--cyan)" }}>🎬</span> : <span className="badge-pill" style={{ color: "var(--amber)" }}>sin video</span>}
            <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => borrar(c.id)}>Eliminar</button>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Sin clases en vivo aún.</span>}
      </div>
    </div>
  );
}
