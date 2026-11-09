"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ScheduleT, TeacherT } from "@/lib/api";
import SectionHero from "@/components/SectionHero";
import { CalendarDays } from "lucide-react";

const WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const TWO_H = 2 * 60 * 60 * 1000;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Classroom() {
  const [events, setEvents] = useState<ScheduleT[]>([]);
  const [teachers, setTeachers] = useState<Record<string, TeacherT>>({});
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  useEffect(() => {
    api.get<ScheduleT[]>("/api/classroom").then(setEvents).catch(() => setEvents([]));
    api.get<TeacherT[]>("/api/teachers").then((ts) => {
      const map: Record<string, TeacherT> = {}; ts.forEach((t) => { map[t.id] = t; }); setTeachers(map);
    }).catch(() => {});
  }, []);

  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWd = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startWd; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function eventsOf(day: Date) {
    return events.filter((e) => sameDay(new Date(e.starts_at), day)).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  }
  const selEvents = eventsOf(selected);

  return (
    <div>
      <SectionHero
        icon={<CalendarDays size={14} />}
        badge="Tu calendario"
        title="Classroom"
        subtitle="Tu calendario de clases en vivo. El enlace de cada clase se envía por el grupo de WhatsApp."
        stats={[{ b: events.length, s: "clases programadas" }]}
      />

      {/* Barra de mes */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{monthLabel}</div>
        <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(n); }}>Hoy</button>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
      </div>

      {/* Calendario */}
      <div className="card" style={{ padding: 14 }}>
        <div className="calgrid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {WEEK.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--muted-soft)", textTransform: "uppercase", letterSpacing: ".06em", padding: "2px 0 6px" }}>{w}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const evs = eventsOf(day);
            const isToday = sameDay(day, today);
            const isSel = sameDay(day, selected);
            return (
              <button key={i} onClick={() => setSelected(day)}
                style={{
                  minHeight: 78, borderRadius: 12, padding: 6, textAlign: "left", color: "var(--text)",
                  border: isSel ? "1px solid var(--cyan)" : "1px solid var(--line)",
                  background: isSel ? "var(--grad-soft)" : "rgba(255,255,255,.015)",
                  display: "flex", flexDirection: "column", gap: 4, cursor: "pointer",
                }}>
                <span style={{ fontSize: 12, fontWeight: 700, width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: 999,
                  background: isToday ? "var(--grad)" : "transparent", color: isToday ? "#04121a" : "var(--muted)" }}>{day.getDate()}</span>
                {evs.slice(0, 2).map((e) => {
                  const t = e.teacher_id ? teachers[e.teacher_id] : undefined;
                  const expired = Date.now() > +new Date(e.starts_at) + TWO_H;
                  return (
                    <span key={e.id} className="calev" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600,
                      padding: "2px 4px", borderRadius: 6, background: expired ? "rgba(255,255,255,.04)" : "rgba(34,211,238,.14)",
                      color: expired ? "var(--muted-soft)" : "#bdeffb", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {t?.photo_url
                        ? <span style={{ width: 14, height: 14, borderRadius: 999, flexShrink: 0, background: `center/cover url(${t.photo_url})` }} />
                        : <span style={{ width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: expired ? "var(--muted-soft)" : "var(--cyan)" }} />}
                      <span className="calev-t" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                    </span>
                  );
                })}
                {evs.length > 2 && <span style={{ fontSize: 10, color: "var(--muted-soft)" }}>+{evs.length - 2} más</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12, textTransform: "capitalize" }}>
          {selected.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" })}
        </h2>
        <div className="grid" style={{ gap: 12 }}>
          {selEvents.map((e) => {
            const t = e.teacher_id ? teachers[e.teacher_id] : undefined;
            const hora = new Date(e.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div className="starfield" style={{ position: "relative", padding: 18, display: "flex", alignItems: "center", gap: 14, background: "var(--aurora)" }}>
                  <div style={{ width: 60, height: 60, borderRadius: 999, flexShrink: 0, border: "2px solid rgba(255,255,255,.28)", boxShadow: "0 8px 22px -6px rgba(0,0,0,.6)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 22,
                    background: t?.photo_url ? `center/cover url(${t.photo_url})` : "var(--grad)" }}>
                    {!t?.photo_url && (t?.name?.charAt(0).toUpperCase() || "📚")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{e.title}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.78)", marginTop: 2 }}>{hora}{t ? ` · ${t.name}` : ""}</div>
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  {e.description && <p className="muted" style={{ fontSize: 13, flex: 1, margin: 0 }}>{e.description}</p>}
                  <span style={{ flex: e.description ? "unset" : 1 }} />
                  <span className="chip" style={{ color: "#25D366", background: "rgba(37,211,102,.12)", border: "1px solid rgba(37,211,102,.3)" }}>
                    <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style={{ marginRight: 5, verticalAlign: "-2px" }} aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5z"/></svg>
                    El enlace se envía por el grupo de WhatsApp
                  </span>
                </div>
              </div>
            );
          })}
          {selEvents.length === 0 && <div className="card" style={{ padding: 20 }}><span className="muted">No hay clases este día.</span></div>}
        </div>
      </div>
    </div>
  );
}
