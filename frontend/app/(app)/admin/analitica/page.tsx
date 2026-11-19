"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Overview = {
  total_students: number; new_7d: number; active_7d: number; active_24h: number;
  lessons_done_7d: number; enrollments: number; posts_7d: number; comments_7d: number;
};
type Day = { day: string; count: number };
type Stu = {
  id: string; name: string; email: string; avatar_url?: string | null; last_active: string | null;
  lessons_done: number; enrollments: number; xp: number; streak: number; stalled: boolean; created_at: string | null;
};

const AVS = ["#6d28d9,#00ffff", "#0891b2,#06b6d4", "#7c3aed,#d946ef", "#166534,#22e67a", "#be185d,#fb7185", "#334155,#64748b"];
function grad(seed: string) { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return `linear-gradient(135deg,${AVS[h % AVS.length]})`; }
const fmt = (n: number) => (n || 0).toLocaleString("es-CO");
function ago(iso: string | null) {
  if (!iso) return "Nunca";
  const ms = Date.now() - new Date(iso).getTime();
  const h = ms / 3600000;
  if (h < 1) return "hace minutos";
  if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = h / 24;
  if (d < 2) return "ayer";
  return `hace ${Math.floor(d)} días`;
}

export default function Analitica() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [stu, setStu] = useState<Stu[]>([]);

  useEffect(() => {
    api.get<Overview>("/api/admin/analytics/overview").then(setOv).catch(() => {});
    api.get<Day[]>("/api/admin/analytics/activity?days=14").then(setDays).catch(() => {});
    api.get<Stu[]>("/api/admin/analytics/students").then(setStu).catch(() => {});
  }, []);

  const maxDay = useMemo(() => Math.max(1, ...days.map((d) => d.count)), [days]);
  const stalled = stu.filter((s) => s.stalled).length;
  const pctActive = ov && ov.total_students ? Math.round(100 * ov.active_7d / ov.total_students) : 0;

  const K = ({ n, l, d, dc, k }: { n: number | string; l: string; d?: string; dc?: string; k: string }) => (
    <div className="an-kpi" style={{ ["--k" as string]: k }}>
      <div className="an-n">{typeof n === "number" ? fmt(n) : n}</div>
      <div className="an-l">{l}</div>
      {d && <div className="an-d" style={dc ? { color: dc } : undefined}>{d}</div>}
    </div>
  );

  return (
    <div className="an-wrap">
      <h1 className="an-h1">Analítica de estudiantes</h1>
      <p className="an-sub">Cómo va tu academia: actividad, avance y quién necesita un empujón.</p>

      {ov && (
        <>
          <div className="an-kpis">
            <K n={ov.total_students} l="Estudiantes" d={ov.new_7d ? `+${ov.new_7d} esta semana` : undefined} dc="#22e67a" k="#00ffff" />
            <K n={ov.active_7d} l="Activos (7 días)" d={`${pctActive}% del total`} dc="#22e67a" k="#22e67a" />
            <K n={ov.active_24h} l="Activos hoy" d="últimas 24 h" k="#d946ef" />
            <K n={ov.lessons_done_7d} l="Lecciones completadas" d="últimos 7 días" k="#f6c453" />
          </div>
          <div className="an-kpis">
            <K n={ov.enrollments} l="Inscripciones totales" k="#8b5cf6" />
            <K n={ov.posts_7d} l="Publicaciones (7 días)" k="#fb7185" />
            <K n={ov.comments_7d} l="Comentarios (7 días)" k="#06b6d4" />
            <K n={stalled} l="Estancados" d={stalled ? "sin actividad 7+ días" : "¡ninguno! 🎉"} dc={stalled ? "#fb7185" : "#22e67a"} k="#f59e0b" />
          </div>
        </>
      )}

      <div className="an-panel">
        <h2 className="an-pt">Lecciones completadas por día</h2>
        <div className="an-ph">Últimos 14 días</div>
        <div className="an-chart">
          {days.map((d) => (
            <div className="an-bar" key={d.day} title={`${d.count} lecciones`}>
              <i style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%` }} />
              <span>{d.day.slice(8)}</span>
            </div>
          ))}
          {days.length === 0 && <span className="an-ph">Aún no hay datos.</span>}
        </div>
      </div>

      <div className="an-panel">
        <h2 className="an-pt">Estudiantes</h2>
        <div className="an-ph">Ordenados por actividad reciente</div>
        <div className="an-tablewrap">
          <table className="an-table">
            <thead><tr><th>Estudiante</th><th>Última actividad</th><th>Lecciones</th><th>XP</th><th>Racha</th><th>Estado</th></tr></thead>
            <tbody>
              {stu.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="an-stu">
                      <div className="an-av" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : { background: grad(s.id) }}>
                        {!s.avatar_url && s.name.charAt(0).toUpperCase()}
                      </div>
                      <div><b>{s.name}</b><span>{s.email}</span></div>
                    </div>
                  </td>
                  <td>{ago(s.last_active)}</td>
                  <td>{s.lessons_done}</td>
                  <td className="an-xp">{fmt(s.xp)}</td>
                  <td className="an-flame">🔥 {s.streak}</td>
                  <td><span className={`an-pill ${s.stalled ? "bad" : "ok"}`}>{s.stalled ? "Estancado" : "Activo"}</span></td>
                </tr>
              ))}
              {stu.length === 0 && <tr><td colSpan={6} className="an-ph" style={{ padding: 20 }}>Aún no hay estudiantes con actividad.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
