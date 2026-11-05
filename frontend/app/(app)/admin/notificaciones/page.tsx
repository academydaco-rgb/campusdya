"use client";
import { useEffect, useState } from "react";
import { api, uploadImage } from "@/lib/api";
import { Megaphone, Trash2, ExternalLink } from "lucide-react";

type Notif = { id: string; title: string; body: string; image_url?: string | null; link_url?: string | null; link_label?: string | null; created_at: string };

export default function AdminNotificaciones() {
  const [items, setItems] = useState<Notif[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() { setItems(await api.get<Notif[]>("/api/admin/notifications")); }
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
    await api.post("/api/admin/notifications", {
      title: title.trim(), body: body.trim(), image_url: image || null,
      link_url: linkUrl.trim() || null, link_label: linkLabel.trim() || null,
    });
    setTitle(""); setBody(""); setImage(""); setLinkUrl(""); setLinkLabel("");
    setMsg("Notificación publicada ✓"); setTimeout(() => setMsg(""), 1600); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/notifications/${id}`); await load(); }

  return (
    <div>
      <div className="sec-h" style={{ marginBottom: 16 }}>
        <span className="ic"><Megaphone /></span>
        <h2 style={{ fontSize: 24 }}>Notificaciones</h2>
      </div>
      <p className="muted" style={{ marginTop: -8, marginBottom: 20 }}>Publica notificaciones que le llegarán a la campana de los estudiantes.</p>

      <div className="grid" style={{ gap: 20, gridTemplateColumns: "minmax(0,420px) 1fr", alignItems: "start" }}>
        <form onSubmit={publicar} className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
          <div style={{ fontWeight: 700, color: "#fff" }}>Nueva notificación</div>
          <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Nueva clase en vivo este jueves" /></div>
          <div><label className="label">Texto</label><textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el mensaje…" /></div>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
            <div><label className="label">Enlace (opcional)</label><input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" /></div>
            <div><label className="label">Texto del botón</label><input className="input" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Ej: Ver más" /></div>
          </div>
          <div>
            <label className="label">Imagen (opcional)</label>
            {image
              ? <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 70, height: 70, borderRadius: 10, background: `center/cover url(${image})`, border: "1px solid var(--line-2)" }} /><button type="button" className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setImage("")}>Quitar</button></div>
              : <input type="file" accept="image/*" onChange={subir} disabled={busy} className="input" style={{ padding: 9 }} />}
          </div>
          {msg && <div style={{ color: "#5ef0c0", fontSize: 13 }}>{msg}</div>}
          <button className="btn btn-primary" style={{ justifyContent: "center" }} disabled={busy}>Publicar notificación</button>
        </form>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#fff" }}>Publicadas</div>
          {items.length === 0 ? <span className="muted" style={{ fontSize: 13 }}>Aún no hay notificaciones.</span> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((n) => (
                <div key={n.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,.02)" }}>
                  {n.image_url && <div style={{ width: 52, height: 52, borderRadius: 10, flex: "none", background: `center/cover url(${n.image_url})`, border: "1px solid var(--line-2)" }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 14, color: "#fff", display: "block" }}>{n.title}</b>
                    <p className="muted" style={{ fontSize: 12.5, margin: "3px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</p>
                    {n.link_url && <span style={{ fontSize: 11.5, color: "#d08bff", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5 }}><ExternalLink size={12} /> {n.link_label || "Enlace"}</span>}
                  </div>
                  <button className="btn btn-ghost" style={{ padding: 8, flex: "none" }} onClick={() => borrar(n.id)} aria-label="Eliminar"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
