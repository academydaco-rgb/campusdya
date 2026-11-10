"use client";
import { useEffect, useState } from "react";
import { api, ToolT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const IMG_HINT = "Imagen cuadrada · 800 × 800 px";

export default function AdminHerramientas() {
  const [items, setItems] = useState<ToolT[]>([]);
  const [title, setTitle] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [url, setUrl] = useState(""); const [label, setLabel] = useState(""); const [order, setOrder] = useState(0);
  const [category, setCategory] = useState("");

  const cats = Array.from(new Set(items.map((t) => (t.category || "").trim()).filter(Boolean)));

  async function load() { setItems(await api.get<ToolT[]>("/api/admin/tools")); }
  useEffect(() => { load().catch(() => {}); }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    await api.post("/api/admin/tools", { title: title.trim(), image_url: img, link_url: url.trim() || null, link_label: label.trim() || null, category: category.trim() || null, order: Number(order) || 0 });
    setTitle(""); setImg(null); setUrl(""); setLabel(""); setOrder(0); setCategory(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/tools/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Herramientas · control total 🧰</h1>
        <p className="muted" style={{ marginTop: 6 }}>Sube una imagen cuadrada (800×800), un título, el enlace del botón y agrúpala por categoría.</p>
      </div>
      <datalist id="tool-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Categoría</label><input className="input" list="tool-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: IA, Diseño, Logística…" /></div>
          <div><label className="label">Orden</label><input className="input" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
        </div>
        <div><label className="label">Imagen (800×800)</label><ImageUpload value={img} onChange={setImg} ratio="square" hint={IMG_HINT} /></div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Enlace del botón</label><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
          <div><label className="label">Texto del botón</label><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Abrir" /></div>
        </div>
        <button className="btn btn-primary">Agregar herramienta</button>
      </form>
      <div className="grid" style={{ gap: 10 }}>
        {items.map((t) => <ToolRow key={t.id} item={t} onSaved={load} onDelete={() => borrar(t.id)} />)}
        {items.length === 0 && <span className="muted">Sin herramientas aún.</span>}
      </div>
    </div>
  );
}

function ToolRow({ item, onSaved, onDelete }: { item: ToolT; onSaved: () => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [img, setImg] = useState<string | null>(item.image_url || null);
  const [url, setUrl] = useState(item.link_url || ""); const [label, setLabel] = useState(item.link_label || "");
  const [category, setCategory] = useState(item.category || "");
  const [order, setOrder] = useState(item.order ?? 0); const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!title.trim()) return; setSaving(true);
    try {
      await api.put(`/api/admin/tools/${item.id}`, { title: title.trim(), image_url: img, link_url: url.trim() || null, link_label: label.trim() || null, category: category.trim() || null, order: Number(order) || 0 });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
      <input className="input" list="tool-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría" />
      <ImageUpload value={img} onChange={setImg} ratio="square" hint={IMG_HINT} />
      <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace del botón" />
      <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Texto del botón" />
      <input className="input" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="Orden" />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
        <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancelar</button>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: item.image_url ? `center/cover url(${item.image_url})` : "linear-gradient(135deg,#1e1636,#0f0b1e)" }} />
      <span style={{ fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
      {item.category && <span className="chip" style={{ color: "var(--violet)" }}>{item.category}</span>}
      <span style={{ flex: 1 }} />
      {item.link_url ? <span className="chip" style={{ color: "var(--cyan)" }}>🔗 {item.link_label || "enlace"}</span> : <span className="chip" style={{ color: "var(--f3)" }}>sin enlace</span>}
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
