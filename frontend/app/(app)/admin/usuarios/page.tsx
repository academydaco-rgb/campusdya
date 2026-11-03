"use client";
import { useEffect, useState } from "react";
import { api, UserT } from "@/lib/api";

interface ImportResultT { creados: number; actualizados: number; inscripciones: number; errores: string[]; }

export default function AdminUsers() {
  const [users, setUsers] = useState<UserT[]>([]);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("alumno");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ImportResultT | null>(null);
  const [msg, setMsg] = useState("");

  async function load() { setUsers(await api.get<UserT[]>(`/api/admin/users?q=${encodeURIComponent(q)}`)); }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      await api.post("/api/admin/users", { name: name.trim(), email: email.trim(), role });
      setName(""); setEmail(""); setRole("alumno"); await load();
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
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12, gridTemplateColumns: "2fr 2fr 1fr auto", alignItems: "end" }}>
        <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Correo</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Rol</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="alumno">Alumno</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn btn-primary">Crear</button>
      </form>

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
          {users.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "#0b0e17" }}>
              <span style={{ flex: 1, fontSize: 14 }}>{u.name}</span>
              <span className="muted" style={{ fontSize: 12 }}>{u.email}</span>
              <span className="badge-pill" style={{ fontSize: 11 }}>{u.role}</span>
              <span className="badge-pill" style={{ fontSize: 11, color: u.status === "active" ? "var(--green)" : "var(--amber)" }}>{u.status}</span>
            </div>
          ))}
          {users.length === 0 && <span className="muted">Sin usuarios todavía.</span>}
        </div>
      </div>
    </div>
  );
}
