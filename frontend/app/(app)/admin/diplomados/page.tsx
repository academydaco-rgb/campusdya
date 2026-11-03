"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AdminDiplomaT, PhaseLiteT, TeacherT } from "@/lib/api";

export default function AdminDiplomas() {
  const [items, setItems] = useState<AdminDiplomaT[]>([]);
  const [phases, setPhases] = useState<PhaseLiteT[]>([]);
  const [teachers, setTeachers] = useState<TeacherT[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [status, setStatus] = useState("draft");
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.get<AdminDiplomaT[]>("/api/admin/diplomas"));
    setPhases(await api.get<PhaseLiteT[]>("/api/admin/phases"));
    setTeachers(await api.get<TeacherT[]>("/api/admin/teachers"));
  }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/api/admin/diplomas", { title: title.trim(), status, phase_id: phaseId || null, teacher_id: teacherId || null });
    setTitle(""); setPhaseId(""); setStatus("draft"); setTeacherId("");
    await load();
  }

  const phaseName = (id?: string | null) => phases.find((p) => p.id === id)?.name || "— sin fase —";

  return (
    <div className="grid" style={{ gap: 20 }}>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr 1fr 1fr auto", alignItems: "end" }}>
        <div><label className="label">Nuevo diplomado</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del diplomado" /></div>
        <div><label className="label">Fase</label>
          <select className="input" value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
            <option value="">— sin fase —</option>
            {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label className="label">Profesor</label>
          <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">— sin profesor —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label className="label">Estado</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Borrador</option><option value="published">Publicado</option>
          </select>
        </div>
        <button className="btn btn-primary">Crear</button>
      </form>
      {msg && <div style={{ color: "#fca5a5" }}>{msg}</div>}
      <div className="grid" style={{ gap: 10 }}>
        {items.map((d) => (
          <Link key={d.id} href={`/admin/diplomados/${d.id}`} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, fontWeight: 700 }}>{d.title}</span>
            <span className="badge-pill">{phaseName(d.phase_id)}</span>
            <span className="badge-pill" style={{ color: d.status === "published" ? "var(--green)" : "var(--amber)" }}>{d.status === "published" ? "Publicado" : "Borrador"}</span>
          </Link>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay diplomados. Crea el primero arriba.</span>}
      </div>
    </div>
  );
}
