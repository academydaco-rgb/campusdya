"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedVideo from "@/components/ProtectedVideo";
import LessonTutor from "@/components/LessonTutor";
import { buildSegments, pathModules, LabeledModule, RouteKey } from "@/lib/routes";
import { api, LessonDetailT, DiplomaDetailT } from "@/lib/api";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [l, setL] = useState<LessonDetailT | null>(null);
  const [diploma, setDiploma] = useState<DiplomaDetailT | null>(null);
  const [error, setError] = useState("");
  const [pickRoute, setPickRoute] = useState<RouteKey | null>(null);

  useEffect(() => {
    if (!id) return;
    setL(null);
    setPickRoute(null);
    api.get<LessonDetailT>(`/api/lessons/${id}`).then((lesson) => {
      setL(lesson);
      if (lesson.diploma_slug) api.get<DiplomaDetailT>(`/api/diplomas/${lesson.diploma_slug}`).then(setDiploma).catch(() => {});
    }).catch((e) => setError(e.message));
  }, [id]);

  async function completar() {
    const r = await api.post<{ badge?: { name: string; icon?: string } | null }>(`/api/lessons/${id}/complete`);
    setL((p) => (p ? { ...p, completed: true } : p));
    setDiploma((d) => d ? { ...d, modules: d.modules.map((m) => ({ ...m, lessons: m.lessons.map((ls) => ls.id === id ? { ...ls, completed: true } : ls) })) } : d);
    try {
      const confetti = (await import("canvas-confetti")).default;
      if (r?.badge) {
        const end = Date.now() + 1200;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: ["#00ffff", "#4f7cff", "#f6b73c"] });
          confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: ["#00ffff", "#4f7cff", "#f6b73c"] });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      } else {
        confetti({ particleCount: 70, spread: 72, origin: { y: 0.7 }, colors: ["#00ffff", "#4f7cff", "#a855f7"] });
      }
    } catch { /* ignore */ }
  }

  const hasRoutes = !!diploma?.has_routes;
  const curModule = diploma?.modules.find((m) => m.lessons.some((ls) => ls.id === id));
  const curRoute = curModule && (curModule.route === "A" || curModule.route === "B") ? (curModule.route as RouteKey) : null;
  const myRoute: RouteKey | null = hasRoutes ? (curRoute || ((diploma?.completed_lessons ?? 0) > 0 ? (diploma?.chosen_route || null) : null)) : null;
  const sideRoute: RouteKey = pickRoute || myRoute || "A";
  const segments = diploma ? buildSegments(diploma.modules, hasRoutes) : [];
  const flat = diploma ? pathModules(diploma.modules, hasRoutes, curRoute || myRoute || "A").flatMap((m) => m.lessons.map((ls) => ({ id: ls.id, title: ls.title }))) : [];
  const idx = flat.findIndex((x) => x.id === id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const fileMeta = (name?: string | null, url?: string | null): [string, string] => {
    const ext = ((name || url || "").split("?")[0].split(".").pop() || "").toLowerCase();
    const map: Record<string, [string, string]> = {
      pdf: ["PDF", "#fb7185"], doc: ["DOC", "#00ffff"], docx: ["DOC", "#00ffff"], txt: ["TXT", "#9aa0b8"],
      xls: ["XLS", "#22e67a"], xlsx: ["XLS", "#22e67a"], csv: ["CSV", "#22e67a"],
      ppt: ["PPT", "#f6c453"], pptx: ["PPT", "#f6c453"], zip: ["ZIP", "#a78bfa"], rar: ["ZIP", "#a78bfa"],
      png: ["IMG", "#d946ef"], jpg: ["IMG", "#d946ef"], jpeg: ["IMG", "#d946ef"], webp: ["IMG", "#d946ef"], gif: ["IMG", "#d946ef"],
      mp4: ["VID", "#8b5cf6"], mov: ["VID", "#8b5cf6"], mp3: ["AUD", "#06b6d4"],
    };
    return map[ext] || ["FILE", "#9aa0b8"];
  };

  if (error) return <div className="card" style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!l) return (
    <div className="dash lsn-dash">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ height: 22, width: 220 }} />
        <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9" }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
      </div>
    </div>
  );

  const hasMats = Array.isArray(l.materials) && l.materials.length > 0;

  const materialsCard = (
    <div className="card lsn-mats" style={{ padding: 18 }}>
      <div className="mat-head">
        <span className="mat-head-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></span>
        <div><div className="mat-head-t">Materiales de la clase</div><div className="mat-head-s">Descarga el material para seguir la lección</div></div>
      </div>
      {hasMats ? (
        <div className="mat-grid">
          {l.materials!.map((m, i) => {
            const [tag, color] = fileMeta(m.nombre, m.url);
            return (
              <a key={i} className="mat-chip" style={{ ["--mc" as string]: color }} href={m.url} target="_blank" rel="noreferrer" download>
                <span className="mat-ic">{tag}</span>
                <span className="mat-body">
                  <span className="mat-name">{m.nombre || "Archivo"}</span>
                  <span className="mat-sub">Material de la clase</span>
                </span>
                <span className="mat-dl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Descargar
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13 }}>Esta clase no tiene materiales por ahora.</div>
      )}
    </div>
  );

  const tutorCard = (
    <div className="card lsn-tutor">
      <LessonTutor lessonId={id} lessonTitle={l.title} diploma={l.diploma_slug || ""} />
    </div>
  );

  return (
    <>
    {diploma && <div style={{ marginBottom: 14 }}><Link href={`/diplomado/${diploma.slug}`} className="muted" style={{ fontSize: 13 }}>← {diploma.title}</Link></div>}
    <div className="dash lsn-dash">
      {/* Principal */}
      <div className="lsn-main">
        <h1 className="lsn-h1">{l.title}</h1>

        <div className="card" style={{ overflow: "hidden" }}>
          {l.videopress_url ? (
            <ProtectedVideo url={l.videopress_url} title={l.title} />
          ) : <div style={{ padding: 40, textAlign: "center" }} className="muted">Esta lección aún no tiene video.</div>}
        </div>

        {/* Navegación, justo debajo del video */}
        <div className="lsn-nav">
          {prev ? <Link href={`/leccion/${prev.id}`} className="btn btn-ghost">← Anterior</Link> : <span />}
          <button className="btn btn-primary" onClick={completar} disabled={l.completed}>{l.completed ? "✓ Completada" : "Marcar como completada"}</button>
          {next ? <Link href={`/leccion/${next.id}`} className="btn btn-ghost" style={{ marginLeft: "auto" }}>Siguiente →</Link> : <span style={{ marginLeft: "auto" }} />}
        </div>

        {/* Tutor IA + materiales */}
        {hasMats ? (
          <div className="lsn-row">{tutorCard}{materialsCard}</div>
        ) : (
          <>{tutorCard}{materialsCard}</>
        )}
      </div>

      {/* Parrilla de contenido (pénsum) */}
      <aside className="lsn-aside"><div className="lsn-aside-inner">
        <div className="lsn-ahead">Contenido</div>
        <div className="card lsn-pensum">
          {!diploma ? <div style={{ padding: 12 }} className="muted">…</div> :
            segments.map((seg) => seg.kind === "common" ? (
              <SideModule key={seg.item.module.id} item={seg.item} currentId={id} />
            ) : (
              <div key={seg.key} className="side-fork">
                <div className="side-fork-t">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 6v12"/><path d="M18 10c0 4-6 4-11.5 8.5"/></svg>
                  Elige tu ruta
                </div>
                <div className="side-tabs">
                  {(["A", "B"] as const).map((rk) => (
                    <button key={rk} type="button" className={`side-tab ${rk.toLowerCase()}${sideRoute === rk ? " on" : ""}`} onClick={() => setPickRoute(rk)}
                      title={rk === "A" ? diploma.route_a_name || "Ruta A" : diploma.route_b_name || "Ruta B"}>
                      <b>{rk}</b><span>{rk === "A" ? diploma.route_a_name || "Ruta A" : diploma.route_b_name || "Ruta B"}</span>
                      {myRoute === rk && <i className="dot" aria-label="Estás en esta ruta" />}
                    </button>
                  ))}
                </div>
                {seg[sideRoute].map((it) => <SideModule key={it.module.id} item={it} currentId={id} />)}
                {seg[sideRoute].length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: "6px 10px" }}>Sin módulos en esta ruta.</div>}
              </div>
            ))}
        </div>
      </div></aside>

      <style jsx global>{`
        .lsn-dash{grid-template-columns:minmax(0,1fr) 340px;align-items:stretch}
        .lsn-main{display:flex;flex-direction:column;gap:16px;min-width:0}
        .lsn-h1{font-size:24px;margin:0;height:34px;display:flex;align-items:center}
        .lsn-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .lsn-row{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:stretch}
        .lsn-tutor{padding:16px;height:340px;display:flex;flex-direction:column}
        .lsn-mats{overflow:auto}
        .lsn-mats .mat-grid{grid-template-columns:1fr}
        .lsn-aside{position:relative;min-height:0}
        .lsn-aside-inner{position:absolute;inset:0;display:flex;flex-direction:column;gap:16px}
        .lsn-ahead{height:34px;display:flex;align-items:center;font-size:18px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.04em}
        .lsn-pensum{flex:1;min-height:0;overflow-y:auto;padding:10px;margin:0}
        @media(max-width:960px){.lsn-dash{grid-template-columns:1fr;align-items:start}.lsn-row{grid-template-columns:1fr}.lsn-tutor{height:360px}.lsn-aside-inner{position:static}.lsn-pensum{max-height:60vh}}
      `}</style>
    </div>
    </>
  );
}

function SideModule({ item, currentId }: { item: LabeledModule; currentId: string }) {
  const m = item.module;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: item.route === "A" ? "#7deeff" : item.route === "B" ? "#f0abfc" : "var(--muted)", padding: "8px 10px" }}>
        {item.route ? `${item.label}` : `Módulo ${Number(item.label)}`} · {m.title}
      </div>
      {item.module.lessons.map((ls) => {
        const cur = ls.id === currentId;
        return (
          <Link key={ls.id} href={`/leccion/${ls.id}`}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 9, fontSize: 13,
              background: cur ? "var(--grad-soft)" : "transparent", color: cur ? "#fff" : "var(--muted)", fontWeight: cur ? 700 : 500 }}>
            <span style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 10, flexShrink: 0,
              background: ls.completed ? "var(--f4)" : "transparent", color: ls.completed ? "#04110b" : "var(--muted)", border: ls.completed ? "none" : "1px solid var(--line-2)" }}>
              {ls.completed ? "✓" : ""}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ls.title}</span>
            {cur && <span style={{ color: "var(--cyan)" }}>▶</span>}
          </Link>
        );
      })}
    </div>
  );
}
