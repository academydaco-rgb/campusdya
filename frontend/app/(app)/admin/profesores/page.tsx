"use client";
import { useEffect, useState } from "react";
import { api, TeacherT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const PHOTO_HINT = "Foto · 600 × 600 px (cuadrada)";

export default function AdminTeachers() {
  const [items, setItems] = useState<TeacherT[]>([]);
  const [name, setName] = useState(""); const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<string | null>(null); const [wa, setWa] = useState("");
  async function load() { setItems(await api.get<TeacherT[]>("/api/admin/teachers")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    await api.post("/api/admin/teachers", { name: name.trim(), bio: bio.trim() || null, photo_url: photo, whatsapp: wa.trim() || null });
    setName(""); setBio(""); setPhoto(null); setWa(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/teachers/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Profesores · control total 🎓</h1>
        <p className="muted" style={{ marginTop: 6 }}>Crea, edita y elimina profesores. La vista del alumno usa una parrilla de 3 columnas.</p>
      </div>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">WhatsApp (con indicativo)</label><input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="57300..." /></div>
        </div>
        <div><label className="label">Foto del profesor</label><ImageUpload value={photo} onChange={setPhoto} ratio="square" hint={PHOTO_HINT} /></div>
        <div><label className="label">Bio</label><textarea className="input" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
        <button className="btn btn-primary">Agregar profesor</button>
      </form>

      <div className="grid" style={{ gap: 10 }}>
        {items.map((t) => <TeacherRow key={t.id} teacher={t} onSaved={load} onDelete={() => borrar(t.id)} />)}
        {items.length === 0 && <span className="muted">Sin profesores aún.</span>}
      </div>
    </div>
  );
}

function TeacherRow({ teacher, onSaved, onDelete }: { teacher: TeacherT; onSaved: () => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(teacher.name);
  const [wa, setWa] = useState(teacher.whatsapp || "");
  const [photo, setPhoto] = useState<string | null>(teacher.photo_url || null);
  const [bio, setBio] = useState(teacher.bio || "");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/teachers/${teacher.id}`, { name: name.trim(), whatsapp: wa.trim() || null, photo_url: photo, bio: bio.trim() || null });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="WhatsApp 57300..." />
        </div>
        <ImageUpload value={photo} onChange={setPhoto} ratio="square" hint={PHOTO_HINT} />
        <textarea className="input" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
          <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: teacher.photo_url ? `center/cover url(${teacher.photo_url})` : "linear-gradient(135deg,var(--cyan),var(--indigo))" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{teacher.name}</div>
        <div className="muted" style={{ fontSize: 12 }}>{teacher.whatsapp || "sin WhatsApp"}</div>
      </div>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
