"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AdminDiplomaT, PhaseLiteT, TeacherT } from "@/lib/api";

/* ───────────── Fila de fase editable ───────────── */
function PhaseRow({ phase, onSaved, onDeleted }: { phase: PhaseLiteT; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(phase.name);
  const [desc, setDesc] = useState(phase.description || "");
  const [icon, setIcon] = useState(phase.icon || "");
  const [color, setColor] = useState(phase.color || "#22d3ee");
  const [order, setOrder] = useState(phase.order);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const dirty = name !== phase.name || desc !== (phase.description || "") || icon !== (phase.icon || "") || color !== (phase.color || "#22d3ee") || order !== phase.order;

  async function guardar() {
    if (!name.trim()) { setNote("Ponle un nombre"); return; }
    setBusy(true); setNote("");
    try {
      await api.put(`/api/admin/phases/${phase.id}`, { name: name.trim(), description: desc.trim() || null, icon: icon.trim() || null, color: color || null, order });
      setNote("Guardada ✓"); setTimeout(() => setNote(""), 1500); onSaved();
    } catch (e) { setNote(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }
  async function eliminar() {
    if (!window.confirm(`¿Eliminar la fase "${phase.name}"?\n\nLos diplomados que estén en esta fase quedarán "sin fase" (no se borran).`)) return;
    setBusy(true);
    try { await api.del(`/api/admin/phases/${phase.id}`); onDeleted(); }
    catch (e) { setNote(e instanceof Error ? e.message : "Error"); setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(5,8,15,.5)", borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 92px 86px", gap: 10, alignItems: "end" }}>
        <div><label className="label">Icono</label><input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🪐" style={{ textAlign: "center", fontSize: 18 }} /></div>
        <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Orden</label><input className="input" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value || "0", 10))} /></div>
        <div><label className="label">Color</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "100%", height: 42, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer" }} /></div>
      </div>
      <div><label className="label">Descripción</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Qué se logra en esta fase" /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" className="btn btn-primary" style={{ fontSize: 13, opacity: dirty ? 1 : .5 }} disabled={busy || !dirty} onClick={guardar}>{busy ? "…" : "Guardar"}</button>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 13, color: "var(--danger, #fca5a5)", borderColor: "rgba(239,68,68,.4)" }} disabled={busy} onClick={eliminar}>Eliminar</button>
        {note && <span className="muted" style={{ fontSize: 12 }}>{note}</span>}
      </div>
    </div>
  );
}

/* ───────────── Crear nueva fase ───────────── */
function NewPhase({ nextOrder, onCreated }: { nextOrder: number; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function crear() {
    if (!name.trim()) { setNote("Ponle un nombre"); return; }
    setBusy(true); setNote("");
    try {
      await api.post("/api/admin/phases", { name: name.trim(), description: desc.trim() || null, icon: icon.trim() || null, color: color || null, order: nextOrder });
      setName(""); setDesc(""); setIcon(""); setColor("#8b5cf6"); onCreated();
    } catch (e) { setNote(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 12, border: "1px dashed rgba(0,255,255,.45)", background: "rgba(0,255,255,.05)" }}>
      <strong style={{ fontSize: 13, color: "var(--cyan, #00ffff)" }}>+ Nueva fase</strong>
      <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 86px", gap: 10, alignItems: "end" }}>
        <div><label className="label">Icono</label><input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="⭐" style={{ textAlign: "center", fontSize: 18 }} /></div>
        <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la fase" /></div>
        <div><label className="label">Color</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "100%", height: 42, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer" }} /></div>
      </div>
      <div><label className="label">Descripción</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Qué se logra en esta fase" /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" className="btn btn-primary" style={{ fontSize: 13 }} disabled={busy} onClick={crear}>{busy ? "Creando…" : "Añadir fase"}</button>
        {note && <span className="muted" style={{ fontSize: 12 }}>{note}</span>}
      </div>
    </div>
  );
}

export default function AdminDiplomas() {
  const [items, setItems] = useState<AdminDiplomaT[]>([]);
  const [phases, setPhases] = useState<PhaseLiteT[]>([]);
  const [teachers, setTeachers] = useState<TeacherT[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [status, setStatus] = useState("draft");
  const [msg, setMsg] = useState("");
  const [showPhases, setShowPhases] = useState(false);

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

  async function borrarDiploma(d: AdminDiplomaT) {
    if (!window.confirm(`¿Eliminar el diplomado "${d.title}"?\n\nSe borran sus módulos y clases. Esta acción no se puede deshacer.`)) return;
    try { await api.del(`/api/admin/diplomas/${d.id}`); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "No se pudo eliminar"); }
  }

  function buildGroups() {
    const conFase = [...phases].sort((a, b) => a.order - b.order).map((p) => ({
      phase: p as PhaseLiteT | null,
      list: items.filter((d) => d.phase_id === p.id).sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title)),
    }));
    const sinFase = items.filter((d) => !d.phase_id || !phases.some((p) => p.id === d.phase_id)).sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
    return [...conFase, { phase: null as PhaseLiteT | null, list: sinFase }];
  }

  async function mover(gi: number, idx: number, dir: number) {
    const groups = buildGroups();
    const g = groups[gi];
    const j = idx + dir;
    if (!g || j < 0 || j >= g.list.length) return;
    [g.list[idx], g.list[j]] = [g.list[j], g.list[idx]];
    const flat = groups.flatMap((x) => x.list);
    try {
      for (let i = 0; i < flat.length; i++) {
        if (flat[i].order !== i) await api.put(`/api/admin/diplomas/${flat[i].id}`, { order: i });
      }
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "No se pudo reordenar"); }
  }

  async function cambiarFase(d: AdminDiplomaT, phase_id: string) {
    try { await api.put(`/api/admin/diplomas/${d.id}`, { phase_id: phase_id || null, order: items.length }); await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "No se pudo mover de fase"); }
  }

  const nextOrder = phases.length ? Math.max(...phases.map((p) => p.order)) + 1 : 1;

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

      {/* ───────── Gestión de fases ───────── */}
      <div className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <button type="button" onClick={() => setShowPhases((v) => !v)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 6, height: 20, borderRadius: 3, background: "linear-gradient(180deg,#00ffff,#8b5cf6)" }} />
            <strong style={{ fontSize: 15 }}>Fases del programa</strong>
            <span className="badge-pill" style={{ fontSize: 11 }}>{phases.length}</span>
          </span>
          <span className="muted" style={{ fontSize: 13 }}>{showPhases ? "Ocultar ▲" : "Gestionar ▼"}</span>
        </button>

        {showPhases && (
          <div className="grid" style={{ gap: 12 }}>
            <span className="muted" style={{ fontSize: 12 }}>Crea, edita el nombre/descripción/orden/color o elimina las fases. El orden define cómo aparecen en “Explorar”.</span>
            {[...phases].sort((a, b) => a.order - b.order).map((p) => (
              <PhaseRow key={p.id} phase={p} onSaved={() => load()} onDeleted={() => load()} />
            ))}
            <NewPhase nextOrder={nextOrder} onCreated={() => load()} />
          </div>
        )}
      </div>

      {/* ───────── Lista de diplomados (agrupada por fase, reordenable) ───────── */}
      <div className="grid" style={{ gap: 18 }}>
        <span className="muted" style={{ fontSize: 12 }}>Organiza los diplomados con ▲▼ dentro de cada fase. Se guarda al instante y así aparecen en la plataforma. Usa el selector para mover uno a otra fase.</span>
        {buildGroups().map((g, gi) => (
          <div key={g.phase?.id || "sin-fase"} className="grid" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: gi ? 4 : 0 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: g.phase?.color || "#6b7196", flexShrink: 0 }} />
              <strong style={{ fontSize: 14 }}>{g.phase?.name || "— Sin fase —"}</strong>
              <span className="badge-pill" style={{ fontSize: 11 }}>{g.list.length}</span>
            </div>
            {g.list.map((d, idx) => (
              <div key={d.id} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: "1px 8px", fontSize: 11, lineHeight: 1.2, minWidth: 0 }} disabled={idx === 0} onClick={() => mover(gi, idx, -1)} aria-label="Subir" title="Subir">▲</button>
                  <button type="button" className="btn btn-ghost" style={{ padding: "1px 8px", fontSize: 11, lineHeight: 1.2, minWidth: 0 }} disabled={idx === g.list.length - 1} onClick={() => mover(gi, idx, 1)} aria-label="Bajar" title="Bajar">▼</button>
                </div>
                <Link href={`/admin/diplomados/${d.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</Link>
                <span className="badge-pill" style={{ color: d.status === "published" ? "var(--green)" : "var(--amber)", flexShrink: 0 }}>{d.status === "published" ? "Publicado" : "Borrador"}</span>
                <select className="input" style={{ width: 150, flexShrink: 0, padding: "8px 10px" }} value={d.phase_id || ""} onChange={(e) => cambiarFase(d, e.target.value)} title="Mover a otra fase">
                  <option value="">— sin fase —</option>
                  {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="button" className="btn btn-ghost" title="Eliminar diplomado" aria-label="Eliminar diplomado" style={{ fontSize: 13, color: "var(--danger, #fca5a5)", borderColor: "rgba(239,68,68,.4)", flexShrink: 0 }} onClick={() => borrarDiploma(d)}>Eliminar</button>
              </div>
            ))}
            {g.list.length === 0 && <span className="muted" style={{ fontSize: 12, paddingLeft: 20 }}>Sin diplomados en esta fase.</span>}
          </div>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay diplomados. Crea el primero arriba.</span>}
      </div>
    </div>
  );
}
