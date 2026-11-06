"use client";
import { useEffect, useState } from "react";
import { api, ProviderT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const COVER_HINT = "Portada · 1920 × 1080 px (16:9)";

export default function AdminProviders() {
  const [items, setItems] = useState<ProviderT[]>([]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [video, setVideo] = useState(""); const [cover, setCover] = useState<string | null>(null); const [wa, setWa] = useState("");
  async function load() { setItems(await api.get<ProviderT[]>("/api/admin/providers")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    await api.post("/api/admin/providers", { title: title.trim(), description: desc.trim() || null, videopress_url: video.trim() || null, cover_url: cover, whatsapp: wa.trim() || null });
    setTitle(""); setDesc(""); setVideo(""); setCover(null); setWa(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/providers/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Proveedores · control total ▦</h1>
        <p className="muted" style={{ marginTop: 6 }}>Sube el video del proveedor con su portada y descripción. Se muestran en una parrilla de 3 columnas.</p>
      </div>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="label">URL del video (VideoPress / embed)</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">WhatsApp del proveedor (con indicativo)</label><input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="57300…" /></div>
        <div><label className="label">Portada</label><ImageUpload value={cover} onChange={setCover} ratio="wide" hint={COVER_HINT} /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn btn-primary">Agregar proveedor</button>
      </form>

      <div className="grid" style={{ gap: 10 }}>
        {items.map((c) => <ProviderRow key={c.id} item={c} onSaved={load} onDelete={() => borrar(c.id)} />)}
        {items.length === 0 && <span className="muted">Sin proveedores aún.</span>}
      </div>
    </div>
  );
}

function ProviderRow({ item, onSaved, onDelete }: { item: ProviderT; onSaved: () => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [video, setVideo] = useState(item.videopress_url || "");
  const [cover, setCover] = useState<string | null>(item.cover_url || null);
  const [desc, setDesc] = useState(item.description || "");
  const [wa, setWa] = useState(item.whatsapp || "");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/providers/${item.id}`, { title: title.trim(), videopress_url: video.trim() || null, cover_url: cover, description: desc.trim() || null, whatsapp: wa.trim() || null });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL del video" />
        <input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="WhatsApp 57300…" />
        <ImageUpload value={cover} onChange={setCover} ratio="wide" hint={COVER_HINT} />
        <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
          <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 72, height: 42, borderRadius: 8, flexShrink: 0, background: item.cover_url ? `center/cover url(${item.cover_url})` : "linear-gradient(135deg,#0a2436,#0b1020)" }} />
      <span style={{ flex: 1, fontWeight: 700, minWidth: 0 }}>{item.title}</span>
      {item.videopress_url ? <span className="chip" style={{ color: "var(--cyan)" }}>🎬 video</span> : <span className="chip" style={{ color: "var(--f3)" }}>sin video</span>}
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
