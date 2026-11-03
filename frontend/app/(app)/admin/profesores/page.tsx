"use client";
import { useEffect, useState } from "react";
import { api, TeacherT } from "@/lib/api";

export default function AdminTeachers() {
  const [items, setItems] = useState<TeacherT[]>([]);
  const [name, setName] = useState(""); const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(""); const [wa, setWa] = useState("");
  async function load() { setItems(await api.get<TeacherT[]>("/api/admin/teachers")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    await api.post("/api/admin/teachers", { name: name.trim(), bio: bio.trim() || null, photo_url: photo.trim() || null, whatsapp: wa.trim() || null });
    setName(""); setBio(""); setPhoto(""); setWa(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/teachers/${id}`); await load(); }
  return (
    <div className="grid" style={{ gap: 18 }}>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">WhatsApp (con indicativo)</label><input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="57300..." /></div>
        </div>
        <div><label className="label">Foto (URL)</label><input className="input" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">Bio</label><textarea className="input" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
        <button className="btn btn-primary">Agregar profesor</button>
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {items.map((t) => (
          <div key={t.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, fontWeight: 700 }}>{t.name}</span>
            <span className="muted" style={{ fontSize: 12 }}>{t.whatsapp}</span>
            <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => borrar(t.id)}>Eliminar</button>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Sin profesores aún.</span>}
      </div>
    </div>
  );
}
