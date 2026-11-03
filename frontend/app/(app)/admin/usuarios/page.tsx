"use client";
import { useEffect, useState } from "react";
import { api, UserT, AdminDiplomaT } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

interface ImportResultT { creados: number; actualizados: number; inscripciones: number; errores: string[]; }

export default function AdminUsers() {
  const [users, setUsers] = useState<UserT[]>([]);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("alumno");
  const [pwd, setPwd] = useState("");
  const [cred, setCred] = useState("");
  const [diplomas, setDiplomas] = useState<AdminDiplomaT[]>([]);
  const [enrollAll, setEnrollAll] = useState(false);
  const [selDip, setSelDip] = useState<Set<string>>(new Set());
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ImportResultT | null>(null);
  const [msg, setMsg] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCover, setVideoCover] = useState<string | null>(null);
  const [videoMsg, setVideoMsg] = useState("");

  async function load() { setUsers(await api.get<UserT[]>(`/api/admin/users?q=${encodeURIComponent(q)}`)); }
  useEffect(() => {
    load().catch((e) => setMsg(e.message));
    api.get<{ video_url?: string | null; cover_url?: string | null }>("/api/settings/dashboard-video")
      .then((v) => { setVideoUrl(v.video_url || ""); setVideoCover(v.cover_url || null); }).catch(() => {});
    api.get<AdminDiplomaT[]>("/api/admin/diplomas").then(setDiplomas).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleDip(id: string) {
    setSelDip((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function guardarVideo() {
    await api.put("/api/admin/settings/dashboard-video", { video_url: videoUrl.trim() || null, cover_url: videoCover });
    setVideoMsg("Guardado ✓"); setTimeout(() => setVideoMsg(""), 1500);
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      const r = await api.post<{ password?: string; email_sent?: boolean }>("/api/admin/users", { name: name.trim(), email: email.trim(), role, password: pwd.trim() || null, enroll_all: enrollAll, diploma_ids: enrollAll ? [] : Array.from(selDip) });
      setCred(`Usuario creado. Contraseña: ${r.password || pwd} · ${r.email_sent ? "Enviada por correo ✓" : "Correo no configurado (comparte la contraseña manualmente)"}`);
      setName(""); setEmail(""); setRole("alumno"); setPwd(""); setEnrollAll(false); setSelDip(new Set()); await load();
    } catch (err) { setMsg(err instanceof Error ? err.message : "Error"); }
  }

  async function importar() {
    const rows = csv.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed = rows
      .filter((l) => !/correo|email/i.test(l) || l.includes("@"))
      .map((l) => { const [n, e] = l.split(/[,;\t]/).map((x) => (x || "").trim()); return { name: n, email: e }; })
      .filter((u) => u.email && u.email.includes("@"));
    if (parsed.length === 0) { setMsg("No se detectaron filas válidas (usa: nombre,correo)"); return; }
    const r = await api.post<ImportResultT>("/api/admin/users/import", { users: parsed });
    setResult(r); setCsv(""); await load();
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>🎬 Video de bienvenida del dashboard</div>
        <p className="muted" style={{ fontSize: 13, marginTop: -4 }}>Aparece al costado derecho del saludo en el dashboard de los alumnos.</p>
        <div><label className="label">Enlace del video (VideoPress / embed)</label><input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://videopress.com/embed/…" /></div>
        <div><label className="label">Portada del video</label><ImageUpload value={videoCover} onChange={setVideoCover} ratio="wide" hint="Horizontal · 1280 × 720 px (16:9)" /></div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={guardarVideo} type="button">Guardar video</button>
          {videoCover && <button className="btn btn-ghost" onClick={() => setVideoCover(null)} type="button">Quitar portada</button>}
          {videoMsg && <span className="muted" style={{ fontSize: 13 }}>{videoMsg}</span>}
        </div>
      </div>

      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12, gridTemplateColumns: "2fr 2fr 1fr 1.4fr auto", alignItems: "end" }}>
        <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Correo</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Rol</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="alumno">Alumno</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
          </select>
        </div>
        <div><label className="label">Contraseña</label><input className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Opcional (se genera)" /></div>
        <button className="btn btn-primary">Crear</button>
      </form>
      <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="label" style={{ margin: 0 }}>Inscribir al crear:</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={enrollAll} onChange={(e) => setEnrollAll(e.target.checked)} /> Todos los diplomados
          </label>
        </div>
        {!enrollAll && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {diplomas.map((d) => (
              <label key={d.id} className="chip" style={{ cursor: "pointer", borderColor: selDip.has(d.id) ? "var(--cyan)" : "var(--line)", color: selDip.has(d.id) ? "var(--cyan)" : "var(--muted)" }}>
                <input type="checkbox" checked={selDip.has(d.id)} onChange={() => toggleDip(d.id)} style={{ marginRight: 4 }} /> {d.title}
              </label>
            ))}
            {diplomas.length === 0 && <span className="muted" style={{ fontSize: 12 }}>No hay diplomados para inscribir.</span>}
          </div>
        )}
      </div>
      {cred && <div className="card" style={{ padding: 14, borderColor: "var(--line-2)", fontSize: 13.5 }}>{cred}</div>}

      <div className="card" style={{ padding: 18 }}>
        <label className="label">Importar masivamente (migración) — una línea por usuario: <b>nombre,correo</b></label>
        <textarea className="input" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"Juan Pérez,juan@gmail.com\nMaría López,maria@gmail.com"} />
        <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={importar} type="button">Importar</button>
          {result && <span className="muted" style={{ fontSize: 13 }}>Creados: {result.creados} · Actualizados: {result.actualizados} · Errores: {result.errores.length}</span>}
        </div>
        {result && result.errores.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5" }}>{result.errores.slice(0, 5).join(" · ")}</div>
        )}
      </div>

      {msg && <div style={{ color: "#fca5a5" }}>{msg}</div>}

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…" />
          <button className="btn btn-ghost" onClick={() => load()} type="button">Buscar</button>
        </div>
        <div className="grid" style={{ gap: 8 }}>
          {users.map((u) => <UserRow key={u.id} user={u} onChange={load} />)}
          {users.length === 0 && <span className="muted">Sin usuarios todavía.</span>}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onChange }: { user: UserT; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const disabled = user.status === "disabled";

  async function guardarClave() {
    if (pwd.trim().length < 6) { setMsg("Mínimo 6 caracteres"); return; }
    await api.put(`/api/admin/users/${user.id}`, { password: pwd.trim() });
    setPwd(""); setMsg("Contraseña actualizada ✓"); setTimeout(() => setMsg(""), 1800);
  }
  async function toggleEstado() {
    await api.put(`/api/admin/users/${user.id}`, { status: disabled ? "active" : "disabled" });
    onChange();
  }
  async function eliminar() {
    await api.del(`/api/admin/users/${user.id}`); onChange();
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid var(--line)", background: "rgba(5,8,15,.5)", opacity: disabled ? .6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
        <span style={{ flex: 1, fontSize: 14 }}>{user.name}</span>
        <span className="muted" style={{ fontSize: 12 }}>{user.email}</span>
        <span className="chip" style={{ fontSize: 11 }}>{user.role}</span>
        <span className="chip" style={{ fontSize: 11, color: disabled ? "var(--f3)" : "var(--f4)" }}>{user.status}</span>
        <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => setOpen((v) => !v)}>Gestionar</button>
      </div>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "0 12px 12px" }}>
          <input className="input" type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nueva contraseña" style={{ maxWidth: 220 }} />
          <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={guardarClave} type="button">Cambiar clave</button>
          <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={toggleEstado} type="button">{disabled ? "Reactivar" : "Deshabilitar"}</button>
          <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12, color: "var(--danger)" }} onClick={eliminar} type="button">Eliminar</button>
          {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
        </div>
      )}
    </div>
  );
}

