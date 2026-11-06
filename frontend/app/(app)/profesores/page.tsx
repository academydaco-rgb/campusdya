"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import { api, TeacherT, AttentionCfgT } from "@/lib/api";
import { GraduationCap } from "lucide-react";

const DAYS: { key: string; label: string; short: string }[] = [
  { key: "mon", label: "Lunes", short: "Lun" }, { key: "tue", label: "Martes", short: "Mar" },
  { key: "wed", label: "Miércoles", short: "Mié" }, { key: "thu", label: "Jueves", short: "Jue" },
  { key: "fri", label: "Viernes", short: "Vie" }, { key: "sat", label: "Sábado", short: "Sáb" },
  { key: "sun", label: "Domingo", short: "Dom" },
];
const fmtRanges = (rs?: [string, string][]) => (rs && rs.length ? rs.map((r) => `${r[0]}–${r[1]}`).join("  ·  ") : "Cerrado");

export default function Profesores() {
  const [items, setItems] = useState<TeacherT[]>([]);
  const [att, setAtt] = useState<AttentionCfgT | null>(null);
  useEffect(() => {
    api.get<TeacherT[]>("/api/teachers").then(setItems).catch(() => setItems([]));
    api.get<AttentionCfgT>("/api/settings/attention").then(setAtt).catch(() => {});
  }, []);

  const now = new Date();
  const todayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const todayRanges = (att?.schedule || {})[todayKey] || [];
  const withinHours = todayRanges.some((r) => hhmm >= r[0] && hhmm <= r[1]);
  const activeNow = !!att?.available && withinHours;

  return (
    <div>
      <section className="ce-hero prof-hero fade-up">
        <div className="ce-hero-glow" /><div className="ce-hero-stars" />
        <div className="ce-hero-in">
          <span className="ce-badge"><GraduationCap size={14} /> Tu equipo de mentores</span>
          <h1 className="ce-title">Profesores</h1>
          <p className="ce-sub">No estás solo: aquí tienes acompañamiento real. Un equipo que te lleva de la mano, paso a paso, hasta tus resultados.</p>
          <div className="ce-stats">
            <div className="ce-stat"><b>{items.length}</b><span>profesores</span></div>
            <div className="ce-stat"><b className={activeNow ? "" : "off"} style={activeNow ? {} : { WebkitTextFillColor: "#9b96bd", color: "#9b96bd" }}>{activeNow ? "Activos" : "En descanso"}</b><span>ahora mismo</span></div>
            <div className="ce-stat"><b style={{ fontSize: 18 }}>{fmtRanges(todayRanges as [string, string][])}</b><span>hoy · {DAYS.find((d) => d.key === todayKey)?.label}</span></div>
          </div>
          {att?.schedule && Object.keys(att.schedule).length > 0 && (
            <div className="prof-sched">
              {DAYS.map((d) => {
                const rs = (att.schedule || {})[d.key] as [string, string][] | undefined;
                const isToday = d.key === todayKey;
                return (
                  <div key={d.key} className={`prof-sched-row${isToday ? " today" : ""}`}>
                    <span className="prof-day">{d.label}</span>
                    <span className="prof-hours">{fmtRanges(rs)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid-3" style={{ marginTop: 24 }}>
        {items.map((t) => (
          <Tilt key={t.id} style={{ height: "100%" }}>
          <div className="card prof-card">
            <div className="flip3d">
              <div className="flip3d-inner">
                <div className="flip3d-front" style={{ background: t.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,var(--cyan),var(--indigo))" }}>
                  {!t.photo_url && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 40, color: "#04121a", fontWeight: 800 }}>{t.name.charAt(0)}</span>}
                  <span className="prof-flip-hint">↻ pasa el cursor</span>
                </div>
                <div className="flip3d-back prof-back">
                  <span className="prof-back-av" style={{ background: t.photo_url ? `center/cover url(${t.photo_url})` : "var(--grad)" }}>{!t.photo_url && t.name.charAt(0).toUpperCase()}</span>
                  {t.bio && <p className="prof-back-bio">{t.bio}</p>}
                  {t.diplomas && t.diplomas.length > 0 && (
                    <div className="prof-back-dips">
                      <span className="prof-back-dips-t">Diplomados</span>
                      <div className="prof-back-dips-list">
                        {t.diplomas.map((d) => <span key={d.slug} className="prof-back-dip">{d.title}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="prof-foot">
              <div className="prof-name">{t.name}</div>
              {t.whatsapp && (
                <a className="btn btn-wa prof-wa"
                  href={`https://wa.me/${t.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                  <svg width="17" height="17" viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.3-5-3.7-10.5-6.5z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Pronto verás a tus profesores aquí.</span>}
      </div>
    </div>
  );
}
