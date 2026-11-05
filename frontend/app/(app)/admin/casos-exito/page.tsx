"use client";
import { useEffect, useState } from "react";
import { api, CasoExitoT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const COVER_HINT = "Portada · 1920 × 1080 px (16:9)";

export default function AdminCasosExito() {
  const [items, setItems] = useState<CasoExitoT[]>([]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [video, setVideo] = useState(""); const [url, setUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [cover, setCover] = useState<string | null>(null);

  async function load() { setItems(await api.get<CasoExitoT[]>("/api/admin/success-cases")); }
  useEffect(() => { load().catch(() => {}); }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    await api.post("/api/admin/success-cases", {
      title: title.trim(), description: desc.trim() || null,
      videopress_url: video.trim() || null, external_url: url.trim() || null,
      cover_url: cover, order: Number(order) || 0,
    });
    setTitle(""); setDesc(""); setVideo(""); setUrl(""); setOrder(0); setCover(null); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/success-cases/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Casos de éxito · control total 🏆</h1>
        <p className="muted" style={{ marginTop: 6 }}>Sube a los estudiantes que la están rompiendo. Se muestran en una parrilla tipo salón de la fama.</p>
      </div>

      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Nombre del estudiante / caso</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Juan Pérez" /></div>
          <div><label className="label">Orden</label><input className="input" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
        </div>
        <div><label className="label">URL del video (VideoPress / embed)</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">URL (enlace externo · tienda, testimonio, perfil)</label><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">Portada</label><ImageUpload value={cover} onChange={setCover} ratio="wide" hint={COVER_HINT} /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Qué logró, en qué nicho, resultados…" /></div>
        <button className="btn btn-primary">Agregar caso de éxito</button>
      </form>

      <div className="grid" style={{ gap: 10 }}>
        {items.map((c) => <CasoRow key={c.id} item={c} onSaved={load} onDelete={() => borrar(c.id)} />)}
        {items.length === 0 && <span className="muted">Sin casos de éxito aún.</span>}
      </div>
    </div>
  );
}

function CasoRow({ item, onSaved, onDelete }: { item: CasoExitoT; onSaved: () => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [video, setVideo] = useState(item.videopress_url || "");
  const [url, setUrl] = useState(item.external_url || "");
  const [cover, setCover] = useState<string | null>(item.cover_url || null);
  const [desc, setDesc] = useState(item.description || "");
  const [order, setOrder] = useState(item.order ?? 0);
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/success-cases/${item.id}`, {
        title: title.trim(), videopress_url: video.trim() || null, external_url: url.trim() || null,
        cover_url: cover, description: desc.trim() || null, order: Number(order) || 0,
      });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre" />
        <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL del video (VideoPress)" />
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL externa" />
        <input className="input" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="Orden" />
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
      <div style={{ width: 72, height: 42, borderRadius: 8, flexShrink: 0, background: item.cover_url ? `center/cover url(${item.cover_url})` : "linear-gradient(135deg,#2a1840,#120b22)" }} />
      <span style={{ flex: 1, fontWeight: 700, minWidth: 0 }}>{item.title}</span>
      {item.videopress_url ? <span className="chip" style={{ color: "var(--cyan)" }}>🎬 video</span> : <span className="chip" style={{ color: "var(--f3)" }}>sin video</span>}
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
