"use client";
import { useEffect, useState } from "react";
import { api, ScheduleT, TeacherT } from "@/lib/api";

function toInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminClassroom() {
  const [items, setItems] = useState<ScheduleT[]>([]);
  const [teachers, setTeachers] = useState<TeacherT[]>([]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [starts, setStarts] = useState(""); const [live, setLive] = useState(""); const [teacher, setTeacher] = useState("");
  async function load() { setItems(await api.get<ScheduleT[]>("/api/admin/schedule")); }
  useEffect(() => {
    load().catch(() => {});
    api.get<TeacherT[]>("/api/admin/teachers").then(setTeachers).catch(() => {});
  }, []);
  async function crear(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim() || !starts) return;
    await api.post("/api/admin/schedule", { title: title.trim(), description: desc.trim() || null, starts_at: new Date(starts).toISOString(), live_url: live.trim() || null, teacher_id: teacher || null });
    setTitle(""); setDesc(""); setStarts(""); setLive(""); setTeacher(""); await load();
  }
  async function borrar(id: string) { await api.del(`/api/admin/schedule/${id}`); await load(); }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Classroom · control total 📅</h1>
        <p className="muted" style={{ marginTop: 6 }}>Programa clases con o sin enlace. Puedes editar el enlace y correr el horario cuando quieras, incluso un minuto antes. El alumno las ve en un calendario.</p>
      </div>
      <form onSubmit={crear} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr" }}>
          <div><label className="label">Título de la clase</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label className="label">Fecha y hora</label><input className="input" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div><label className="label">Profesor (su foto será la portada)</label>
            <select className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">— Sin asignar —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Enlace en vivo (opcional)</label><input className="input" value={live} onChange={(e) => setLive(e.target.value)} placeholder="https://meet… (lo puedes agregar después)" /></div>
        </div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn btn-primary">Programar clase</button>
      </form>

      <div className="grid" style={{ gap: 10 }}>
        {items.map((e) => <EventRow key={e.id} ev={e} teachers={teachers} onSaved={load} onDelete={() => borrar(e.id)} toInput={toInput} />)}
        {items.length === 0 && <span className="muted">Sin clases programadas.</span>}
      </div>
    </div>
  );
}

function EventRow({ ev, teachers, onSaved, onDelete, toInput }: { ev: ScheduleT; teachers: TeacherT[]; onSaved: () => void; onDelete: () => void; toInput: (s?: string | null) => string }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(ev.title);
  const [starts, setStarts] = useState(toInput(ev.starts_at));
  const [live, setLive] = useState(ev.live_url || "");
  const [desc, setDesc] = useState(ev.description || "");
  const [teacher, setTeacher] = useState(ev.teacher_id || "");
  const [saving, setSaving] = useState(false);
  const upcoming = new Date(ev.starts_at).getTime() >= Date.now();
  const tName = teachers.find((t) => t.id === ev.teacher_id)?.name;

  async function guardar() {
    if (!title.trim() || !starts) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/schedule/${ev.id}`, { title: title.trim(), starts_at: new Date(starts).toISOString(), live_url: live.trim() || null, description: desc.trim() || null, teacher_id: teacher || null });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div className="card" style={{ padding: 16, display: "grid", gap: 10, borderColor: "var(--line-2)" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
          <input className="input" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <select className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
            <option value="">— Sin profesor —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="input" value={live} onChange={(e) => setLive(e.target.value)} placeholder="Enlace en vivo (https://…)" />
        </div>
        <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
          <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, borderColor: upcoming ? "var(--cyan)" : "var(--line)" }}>
      <span style={{ fontSize: 18 }}>{upcoming ? "🟣" : "✓"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{ev.title}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {new Date(ev.starts_at).toLocaleString("es-CO", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          {tName ? ` · ${tName}` : ""}
          {ev.live_url ? <span style={{ color: "var(--f4)" }}> · con enlace</span> : <span style={{ color: "var(--f3)" }}> · sin enlace</span>}
        </div>
      </div>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setEdit(true)}>Editar</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete}>Eliminar</button>
    </div>
  );
}
