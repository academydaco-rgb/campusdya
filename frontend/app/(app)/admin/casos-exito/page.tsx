"use client";
import { useEffect, useState } from "react";
import { api, CasoExitoT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const COVER_HINT = "Portada · 1920 × 1080 px (16:9)";

export default function AdminCasosExito() {
  const [items, setItems] = useState<CasoExitoT[]>([]);
  const [video, setVideo] = useState("");
  const [cover, setCover] = useState<string | null>(null);

  async function load() { setItems(await api.get<CasoExitoT[]>("/api/admin/success-cases")); }
  useEffect(() => { load().catch(() => {}); }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!video.trim() && !cover) return;
    await api.post("/api/admin/success-cases", {
      title: "Caso de éxito",
      videopress_url: video.trim() || null,
      cover_url: cover,
      order: 0,
    });
    setVideo(""); setCover(null); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/success-cases/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Casos de éxito · control total 🏆</h1>
        <p className="muted" style={{ marginTop: 6 }}>Sube solo el video y su portada. Se muestran en una parrilla tipo salón de la fama.</p>
      </div>

      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div><label className="label">URL del video (VideoPress / YouTube / embed)</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">Portada</label><ImageUpload value={cover} onChange={setCover} ratio="wide" hint={COVER_HINT} /></div>
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
  const [video, setVideo] = useState(item.videopress_url || "");
  const [cover, setCover] = useState<string | null>(item.cover_url || null);
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    try {
      await api.put(`/api/admin/success-cases/${item.id}`, {
        title: item.title || "Caso de éxito",
        videopress_url: video.trim() || null,
        external_url: item.external_url || null,
        cover_url: cover,
        description: item.description || null,
        order: item.order ?? 0,
      });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
        <div><label className="label">URL del video</label><input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://…" /></div>
        <div><label className="label">Portada</label><ImageUpload value={cover} onChange={setCover} ratio="wide" hint={COVER_HINT} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
          <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 84, height: 48, borderRadius: 8, flexShrink: 0, background: item.cover_url ? `center/cover url(${item.cover_url})` : "linear-gradient(135deg,#2a1840,#120b22)" }} />
      {item.videopress_url ? <span className="chip" style={{ color: "var(--cyan)" }}>🎬 con video</span> : <span className="chip" style={{ color: "var(--f3)" }}>sin video</span>}
      <span style={{ flex: 1 }} />
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
