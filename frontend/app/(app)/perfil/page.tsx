"use client";
import { useEffect, useState } from "react";
import { api, uploadImageUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Perfil() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // contraseña
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [nw2, setNw2] = useState("");
  const [pmsg, setPmsg] = useState("");

  useEffect(() => {
    if (user) { setName(user.name || ""); setBio(user.bio || ""); setAvatar(user.avatar_url || null); }
  }, [user]);

  async function subirAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setMsg("");
    try { setAvatar(await uploadImageUser(f)); } catch (ex) { setMsg(ex instanceof Error ? ex.message : "Error"); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    await api.put("/api/me/profile", { name: name.trim() || null, bio: bio.trim() || null, avatar_url: avatar });
    await refresh();
    setMsg("Perfil guardado ✓"); setTimeout(() => setMsg(""), 2000);
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault(); setPmsg("");
    if (nw.length < 6) { setPmsg("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if (nw !== nw2) { setPmsg("Las contraseñas no coinciden"); return; }
    try {
      await api.put("/api/me/password", { current_password: cur, new_password: nw });
      setCur(""); setNw(""); setNw2(""); setPmsg("Contraseña actualizada ✓"); setTimeout(() => setPmsg(""), 2500);
    } catch (ex) { setPmsg(ex instanceof Error ? ex.message : "Error"); }
  }

  return (
    <div className="grid" style={{ gap: 22, maxWidth: 680 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Mi perfil ◍</h1>
        <p className="muted" style={{ marginTop: 6 }}>Personaliza tu avatar y tu descripción, y gestiona tu contraseña.</p>
      </div>

      {/* Perfil */}
      <form onSubmit={guardarPerfil} className="card" style={{ padding: 22, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: 999, flexShrink: 0, border: "1px solid var(--line-2)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 30, color: "#04141c",
            background: avatar ? `center/cover url(${avatar})` : "var(--grad)" }}>
            {!avatar && (name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <label className="btn btn-ghost" style={{ fontSize: 13 }}>{busy ? "Subiendo…" : "Subir foto"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={subirAvatar} style={{ display: "none" }} /></label>
            {avatar && <button type="button" className="btn btn-ghost" style={{ fontSize: 13, marginLeft: 8 }} onClick={() => setAvatar(null)}>Quitar</button>}
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Cuadrada · 400 × 400 px</div>
          </div>
        </div>
        <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Sobre mí (lo verán tus compañeros en Comunidad)</label><textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntales quién eres, qué vendes o tu meta…" /></div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary">Guardar perfil</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </form>

      {/* Contraseña */}
      <form onSubmit={cambiarPassword} className="card" style={{ padding: 22, display: "grid", gap: 14 }}>
        <div style={{ fontWeight: 800 }}>Cambiar contraseña</div>
        <div><label className="label">Contraseña actual</label><input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div><label className="label">Nueva contraseña</label><input className="input" type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" /></div>
          <div><label className="label">Repetir nueva</label><input className="input" type="password" value={nw2} onChange={(e) => setNw2(e.target.value)} autoComplete="new-password" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary">Actualizar contraseña</button>
          {pmsg && <span className="muted" style={{ fontSize: 13 }}>{pmsg}</span>}
        </div>
      </form>
    </div>
  );
}
