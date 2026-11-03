"use client";
import { useEffect, useState } from "react";
import { api, ScheduleT } from "@/lib/api";

export default function AdminClassroom() {
  const [items, setItems] = useState<ScheduleT[]>([]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [starts, setStarts] = useState(""); const [live, setLive] = useState("");
  async function load() { setItems(await api.get<ScheduleT[]>("/api/admin/schedule")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim() || !starts) return;
    await api.post("/api/admin/schedule", { title: title.trim(), description: desc.trim() || null, starts_at: starts, live_url: live.trim() || null });
    setTitle(""); setDesc(""); setStarts(""); setLive(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/schedule/${id}`); await load(); }
  return (
    <div className="grid" style={{ gap: 18 }}>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Título de la clase</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label className="label">Fecha y hora</label><input className="input" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} /></div>
        </div>
        <div><label className="label">Enlace en vivo (opcional)</label><input className="input" value={live} onChange={(e) => setLive(e.target.value)} placeholder="https://meet…" /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn btn-primary">Programar clase</button>
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {items.map((e) => (
          <div key={e.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, fontWeight: 700 }}>{e.title}</span>
            <span className="muted" style={{ fontSize: 12 }}>{new Date(e.starts_at).toLocaleString("es-CO")}</span>
            <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => borrar(e.id)}>Eliminar</button>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Sin clases programadas.</span>}
      </div>
    </div>
  );
}
