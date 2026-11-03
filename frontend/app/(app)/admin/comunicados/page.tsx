"use client";
import { useEffect, useState } from "react";
import { api, uploadImage, AnnouncementT } from "@/lib/api";

export default function AdminComunicados() {
  const [items, setItems] = useState<AnnouncementT[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [days, setDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() { setItems(await api.get<AnnouncementT[]>("/api/admin/announcements")); }
  useEffect(() => { load().catch(() => {}); }, []);

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setMsg("");
    try { setImage(await uploadImage(f)); } catch (ex) { setMsg(ex instanceof Error ? ex.message : "Error"); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await api.post("/api/admin/announcements", {
      title: title.trim(), body: body.trim(), image_url: image || null,
      visible_days: days ? Number(days) : null,
    });
    setTitle(""); setBody(""); setImage(""); setDays(""); setMsg("Publicado ✓");
    setTimeout(() => setMsg(""), 1500); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/announcements/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <form onSubmit={publicar} className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
        <div style={{ fontWeight: 700 }}>Publicar comunicado</div>
        <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Nueva clase en vivo este jueves" /></div>
        <div><label className="label">Mensaje</label><textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe la noticia…" /></div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "2fr 1fr", alignItems: "end" }}>
          <div>
            <label className="label">Imagen (opcional)</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 90, height: 52, borderRadius: 8, border: "1px solid var(--line)", background: image ? `center/cover url(${image})` : "rgba(5,8,15,.6)", flexShrink: 0 }} />
              <label className="btn btn-ghost" style={{ fontSize: 13 }}>{busy ? "Subiendo…" : "Subir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={subir} style={{ display: "none" }} /></label>
            </div>
          </div>
          <div><label className="label">Días visible</label><input className="input" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Ej: 7 (vacío = siempre)" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary">Publicar</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </form>

      <div className="grid" style={{ gap: 10 }}>
        {items.map((n) => (
          <div key={n.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            {n.image_url && <div style={{ width: 54, height: 40, borderRadius: 8, background: `center/cover url(${n.image_url})`, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{n.expires_at ? `Vence: ${new Date(n.expires_at).toLocaleDateString("es-CO")}` : "Permanente"}</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => borrar(n.id)}>Eliminar</button>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay comunicados.</span>}
      </div>
    </div>
  );
}
