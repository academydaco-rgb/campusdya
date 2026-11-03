"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, AdminDiplomaT, AdminModuleT, AdminLessonT, PhaseLiteT } from "@/lib/api";

export default function EditDiploma() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [dip, setDip] = useState<AdminDiplomaT | null>(null);
  const [phases, setPhases] = useState<PhaseLiteT[]>([]);
  const [modules, setModules] = useState<AdminModuleT[]>([]);
  const [lessons, setLessons] = useState<Record<string, AdminLessonT[]>>({});
  const [msg, setMsg] = useState("");
  const [newModule, setNewModule] = useState("");

  const loadLessons = useCallback(async (moduleId: string) => {
    const ls = await api.get<AdminLessonT[]>(`/api/admin/lessons?module_id=${moduleId}`);
    setLessons((prev) => ({ ...prev, [moduleId]: ls }));
  }, []);

  const load = useCallback(async () => {
    const [d, ph, mods] = await Promise.all([
      api.get<AdminDiplomaT>(`/api/admin/diplomas/${id}`),
      api.get<PhaseLiteT[]>("/api/admin/phases"),
      api.get<AdminModuleT[]>(`/api/admin/modules?diploma_id=${id}`),
    ]);
    setDip(d); setPhases(ph); setModules(mods);
    await Promise.all(mods.map((m) => loadLessons(m.id)));
  }, [id, loadLessons]);

  useEffect(() => { if (id) load().catch((e) => setMsg(e.message)); }, [id, load]);

  async function guardarDiploma(e: React.FormEvent) {
    e.preventDefault();
    if (!dip) return;
    await api.put(`/api/admin/diplomas/${id}`, {
      title: dip.title, description: dip.description, cover_url: dip.cover_url,
      status: dip.status, order: dip.order, phase_id: dip.phase_id || null,
    });
    setMsg("Guardado ✓"); setTimeout(() => setMsg(""), 1500);
  }

  async function crearModulo() {
    if (!newModule.trim()) return;
    await api.post("/api/admin/modules", { diploma_id: id, title: newModule.trim(), status: "published", order: modules.length });
    setNewModule(""); await load();
  }
  async function borrarModulo(mid: string) {
    await api.del(`/api/admin/modules/${mid}`); await load();
  }

  if (!dip) return <span className="muted">{msg || "Cargando…"}</span>;

  return (
    <div className="grid" style={{ gap: 22 }}>
      <Link href="/admin/diplomados" className="muted" style={{ fontSize: 13 }}>← Diplomados</Link>

      <form onSubmit={guardarDiploma} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div><label className="label">Título</label><input className="input" value={dip.title} onChange={(e) => setDip({ ...dip, title: e.target.value })} /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={dip.description || ""} onChange={(e) => setDip({ ...dip, description: e.target.value })} /></div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div><label className="label">Fase</label>
            <select className="input" value={dip.phase_id || ""} onChange={(e) => setDip({ ...dip, phase_id: e.target.value || null })}>
              <option value="">— sin fase —</option>
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="label">Estado</label>
            <select className="input" value={dip.status} onChange={(e) => setDip({ ...dip, status: e.target.value })}>
              <option value="draft">Borrador</option><option value="published">Publicado</option>
            </select>
          </div>
          <div><label className="label">Portada (URL)</label><input className="input" value={dip.cover_url || ""} onChange={(e) => setDip({ ...dip, cover_url: e.target.value })} placeholder="https://…" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary">Guardar diplomado</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </form>

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Módulos y lecciones</h2>
        <div className="card" style={{ padding: 14, display: "flex", gap: 10, marginBottom: 14 }}>
          <input className="input" value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="Nuevo módulo…" />
          <button className="btn btn-primary" onClick={crearModulo} type="button">Agregar módulo</button>
        </div>
        <div className="grid" style={{ gap: 14 }}>
          {modules.map((m, mi) => (
            <ModuleBlock key={m.id} index={mi} module={m} lessons={lessons[m.id] || []}
              onChanged={() => loadLessons(m.id)} onDelete={() => borrarModulo(m.id)} />
          ))}
          {modules.length === 0 && <span className="muted">Agrega el primer módulo arriba.</span>}
        </div>
      </div>
    </div>
  );
}

function ModuleBlock({ index, module, lessons, onChanged, onDelete }: {
  index: number; module: AdminModuleT; lessons: AdminLessonT[]; onChanged: () => void; onDelete: () => void;
}) {
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");

  async function crearLeccion() {
    if (!title.trim()) return;
    await api.post("/api/admin/lessons", {
      module_id: module.id, title: title.trim(), videopress_url: video.trim() || null,
      status: "published", order: lessons.length,
    });
    setTitle(""); setVideo(""); onChanged();
  }
  async function borrar(lid: string) { await api.del(`/api/admin/lessons/${lid}`); onChanged(); }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 700 }}><span className="muted">Módulo {index + 1} · </span>{module.title}</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete} type="button">Eliminar módulo</button>
      </div>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {lessons.map((l, li) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "#0b0e17" }}>
            <span className="muted" style={{ fontSize: 12 }}>{li + 1}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{l.title}</span>
            {l.videopress_url ? <span className="badge-pill" style={{ color: "var(--cyan)" }}>🎬 video</span> : <span className="badge-pill" style={{ color: "var(--amber)" }}>sin video</span>}
            <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => borrar(l.id)} type="button">✕</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr auto" }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la lección" />
        <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL del video (VideoPress)" />
        <button className="btn btn-primary" onClick={crearLeccion} type="button">Agregar</button>
      </div>
    </div>
  );
}
