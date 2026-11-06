"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toEmbed } from "@/components/ProtectedVideo";
import { api, uploadImage, AdminDiplomaT, AdminModuleT, AdminLessonT, PhaseLiteT, TeacherT , uploadFile} from "@/lib/api";

function ImageUpload({ value, onChange, hint, ratio }: { value?: string | null; onChange: (url: string) => void; hint: string; ratio: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr("");
    try { onChange(await uploadImage(f)); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Error al subir"); }
    finally { setBusy(false); e.target.value = ""; }
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: ratio === "square" ? 64 : 112, height: 64, borderRadius: 10, border: "1px solid var(--line)", flexShrink: 0,
          background: value ? `center/cover url(${value})` : "rgba(5,8,15,.6)" }} />
        <label className="btn btn-ghost" style={{ fontSize: 13 }}>
          {busy ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} style={{ display: "none" }} />
        </label>
        <span className="muted" style={{ fontSize: 12 }}>{hint}</span>
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  );
}

export default function EditDiploma() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [dip, setDip] = useState<AdminDiplomaT | null>(null);
  const [phases, setPhases] = useState<PhaseLiteT[]>([]);
  const [teachers, setTeachers] = useState<TeacherT[]>([]);
  const [modules, setModules] = useState<AdminModuleT[]>([]);
  const [lessons, setLessons] = useState<Record<string, AdminLessonT[]>>({});
  const [msg, setMsg] = useState("");
  const [newModule, setNewModule] = useState("");

  const loadLessons = useCallback(async (moduleId: string) => {
    const ls = await api.get<AdminLessonT[]>(`/api/admin/lessons?module_id=${moduleId}`);
    setLessons((prev) => ({ ...prev, [moduleId]: ls }));
  }, []);

  const load = useCallback(async () => {
    const [d, ph, mods, tch] = await Promise.all([
      api.get<AdminDiplomaT>(`/api/admin/diplomas/${id}`),
      api.get<PhaseLiteT[]>("/api/admin/phases"),
      api.get<AdminModuleT[]>(`/api/admin/modules?diploma_id=${id}`),
      api.get<TeacherT[]>("/api/admin/teachers"),
    ]);
    setDip(d); setPhases(ph); setModules(mods); setTeachers(tch);
    await Promise.all(mods.map((m) => loadLessons(m.id)));
  }, [id, loadLessons]);

  useEffect(() => { if (id) load().catch((e) => setMsg(e.message)); }, [id, load]);

  async function guardarDiploma(e: React.FormEvent) {
    e.preventDefault();
    if (!dip) return;
    await api.put(`/api/admin/diplomas/${id}`, {
      title: dip.title, description: dip.description, cover_url: dip.cover_url,
      status: dip.status, order: dip.order, phase_id: dip.phase_id || null, teacher_id: dip.teacher_id || null, badge_image_url: dip.badge_image_url || null,
      hero_image_url: dip.hero_image_url || null, intro_video_url: toEmbed(dip.intro_video_url) || null,
    });
    setMsg("Guardado ✓"); setTimeout(() => setMsg(""), 1500);
  }
  async function crearModulo() {
    if (!newModule.trim()) return;
    await api.post("/api/admin/modules", { diploma_id: id, title: newModule.trim(), status: "published", order: modules.length });
    setNewModule(""); await load();
  }
  async function borrarModulo(mid: string) { await api.del(`/api/admin/modules/${mid}`); await load(); }

  if (!dip) return <span className="muted">{msg || "Cargando…"}</span>;

  return (
    <div className="grid" style={{ gap: 22 }}>
      <Link href="/admin/diplomados" className="muted" style={{ fontSize: 13 }}>← Diplomados</Link>

      <form onSubmit={guardarDiploma} className="card" style={{ padding: 22, display: "grid", gap: 14 }}>
        <div><label className="label">Título</label><input className="input" value={dip.title} onChange={(e) => setDip({ ...dip, title: e.target.value })} /></div>
        <div><label className="label">Descripción</label><textarea className="input" rows={2} value={dip.description || ""} onChange={(e) => setDip({ ...dip, description: e.target.value })} /></div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div><label className="label">Profesor</label>
            <select className="input" value={dip.teacher_id || ""} onChange={(e) => setDip({ ...dip, teacher_id: e.target.value || null })}>
              <option value="">— sin profesor —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
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
        </div>
        <div>
          <label className="label">Portada del diplomado</label>
          <ImageUpload value={dip.cover_url} onChange={(url) => setDip({ ...dip, cover_url: url })} ratio="square" hint="Cuadrada · 800 × 800 px (PNG o JPG)" />
        </div>
        <div style={{ display: "grid", gap: 12, padding: 16, borderRadius: 14, border: "1px dashed var(--line-2)", background: "rgba(34,224,255,.04)" }}>
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>🎬 Cabecera del diplomado (estilo Netflix)</div>
          <div>
            <label className="label">Portada de la cabecera (fondo)</label>
            <ImageUpload value={dip.hero_image_url} onChange={(url) => setDip({ ...dip, hero_image_url: url })} ratio="wide" hint="Horizontal · 1920 × 800 px (JPG o WEBP)" />
          </div>
          <div>
            <label className="label">Video de presentación (VideoPress)</label>
            <input className="input" value={dip.intro_video_url || ""} onChange={(e) => setDip({ ...dip, intro_video_url: e.target.value })}
              placeholder="https://videopress.com/embed/XXXXXXXX" />
            {dip.intro_video_url?.trim()
              ? (toEmbed(dip.intro_video_url)
                  ? <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--f4)", fontWeight: 700 }}>✓ Video reconocido. Guarda el diplomado para publicarlo.</div>
                  : <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--danger)", fontWeight: 700 }}>✕ Enlace no válido. Pega el enlace de VideoPress (videopress.com/v/… o el código de inserción).</div>)
              : <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Pega el enlace de VideoPress o el código de inserción completo.</div>}
          </div>
        </div>
        <div>
          <label className="label">Insignia del diplomado</label>
          <ImageUpload value={dip.badge_image_url} onChange={(url) => setDip({ ...dip, badge_image_url: url })} ratio="square" hint="Cuadrada · 512 × 512 px (PNG con fondo transparente)" />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-primary">Guardar diplomado</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </form>

      <div>
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Módulos y lecciones</h2>
        <div className="card" style={{ padding: 14, display: "flex", gap: 10, marginBottom: 14 }}>
          <input className="input" value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="Nuevo módulo…" />
          <button className="btn btn-primary" onClick={crearModulo} type="button">Agregar módulo</button>
        </div>
        <div className="grid" style={{ gap: 14 }}>
          {modules.map((m, mi) => (
            <ModuleBlock key={m.id} index={mi} module={m} lessons={lessons[m.id] || []}
              onLessons={() => loadLessons(m.id)} onModule={load} onDelete={() => borrarModulo(m.id)} />
          ))}
          {modules.length === 0 && <span className="muted">Agrega el primer módulo arriba.</span>}
        </div>
      </div>
    </div>
  );
}

function ModuleBlock({ index, module, lessons, onLessons, onModule, onDelete }: {
  index: number; module: AdminModuleT; lessons: AdminLessonT[]; onLessons: () => void; onModule: () => void; onDelete: () => void;
}) {
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");

  async function crearLeccion() {
    if (!title.trim()) return;
    await api.post("/api/admin/lessons", { module_id: module.id, title: title.trim(), videopress_url: video.trim() || null, status: "published", order: lessons.length });
    setTitle(""); setVideo(""); onLessons();
  }
  async function borrar(lid: string) { await api.del(`/api/admin/lessons/${lid}`); onLessons(); }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}><span className="muted">Módulo {index + 1} · </span>{module.title}</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onDelete} type="button">Eliminar módulo</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {lessons.map((l, li) => (
          <LessonRow key={l.id} index={li} lesson={l} onSaved={onLessons} onDelete={() => borrar(l.id)} />
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

function LessonRow({ index, lesson, onSaved, onDelete }: {
  index: number; lesson: AdminLessonT; onSaved: () => void; onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [video, setVideo] = useState(lesson.videopress_url || "");
  const [content, setContent] = useState(lesson.content || "");
  const [materials, setMaterials] = useState<{ nombre: string; url: string }[]>(
    Array.isArray(lesson.materials) ? (lesson.materials as { nombre: string; url: string }[]) : []
  );
  const [saving, setSaving] = useState(false);
  const [upBusy, setUpBusy] = useState(false);

  function setMat(i: number, patch: Partial<{ nombre: string; url: string }>) {
    setMaterials((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function addMat() { setMaterials((m) => [...m, { nombre: "", url: "" }]); }
  function delMat(i: number) { setMaterials((m) => m.filter((_, j) => j !== i)); }
  async function subirMat(i: number, file: File) {
    setUpBusy(true);
    try { const r = await uploadFile(file); setMat(i, { url: r.url, nombre: materials[i]?.nombre || r.name }); }
    catch (e) { alert(e instanceof Error ? e.message : "Error al subir"); }
    finally { setUpBusy(false); }
  }

  async function guardar() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const mats = materials.filter((m) => m.url.trim()).map((m) => ({ nombre: m.nombre.trim() || "Descargar", url: m.url.trim() }));
      await api.put(`/api/admin/lessons/${lesson.id}`, { title: title.trim(), videopress_url: video.trim() || null, content: content.trim() || null, materials: mats });
      setEdit(false); onSaved();
    } finally { setSaving(false); }
  }

  if (edit) {
    return (
      <div style={{ display: "grid", gap: 8, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "rgba(5,8,15,.6)" }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL del video (VideoPress)" />
        <textarea className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenido / descripción (opcional)" rows={3} style={{ resize: "vertical" }} />
        <div style={{ display: "grid", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px dashed var(--line-2)" }}>
          <div className="label" style={{ margin: 0 }}>Archivos / materiales de la clase</div>
          {materials.map((m, i) => (
            <div key={i} style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr auto", alignItems: "center" }}>
              <input className="input" value={m.nombre} onChange={(e) => setMat(i, { nombre: e.target.value })} placeholder="Nombre del botón" />
              <input className="input" value={m.url} onChange={(e) => setMat(i, { url: e.target.value })} placeholder="Enlace o sube un archivo →" />
              <div style={{ display: "flex", gap: 6 }}>
                <label className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }}>{upBusy ? "…" : "Subir"}
                  <input type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) subirMat(i, f); e.target.value = ""; }} />
                </label>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 9px" }} onClick={() => delMat(i)}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12, justifySelf: "start" }} onClick={addMat}>+ Agregar archivo</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={saving} type="button">Guardar</button>
          <button className="btn btn-ghost" onClick={() => { setEdit(false); setTitle(lesson.title); setVideo(lesson.videopress_url || ""); setContent(lesson.content || ""); }} type="button">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "rgba(5,8,15,.5)" }}>
      <span className="muted" style={{ fontSize: 12 }}>{index + 1}</span>
      <span style={{ flex: 1, fontSize: 14 }}>{lesson.title}</span>
      {lesson.videopress_url ? <span className="chip" style={{ color: "var(--cyan)", fontSize: 11 }}>🎬 video</span> : <span className="chip" style={{ color: "var(--f3)", fontSize: 11 }}>sin video</span>}
      <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => setEdit(true)} type="button">Editar</button>
      <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={onDelete} type="button">✕</button>
    </div>
  );
}

