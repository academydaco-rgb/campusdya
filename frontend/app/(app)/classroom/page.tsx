"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ScheduleT, TeacherT } from "@/lib/api";

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
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Classroom 📅</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 20 }}>Tu calendario de clases en vivo. Toca una clase para entrar; el enlace se cierra 2 horas después de iniciada.</p>

      {/* Barra de mes */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{monthLabel}</div>
        <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(n); }}>Hoy</button>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
      </div>

      {/* Calendario */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
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
                    <span key={e.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600,
                      padding: "2px 4px", borderRadius: 6, background: expired ? "rgba(255,255,255,.04)" : "rgba(34,211,238,.14)",
                      color: expired ? "var(--muted-soft)" : "#bdeffb", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {t?.photo_url
                        ? <span style={{ width: 14, height: 14, borderRadius: 999, flexShrink: 0, background: `center/cover url(${t.photo_url})` }} />
                        : <span style={{ width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: expired ? "var(--muted-soft)" : "var(--cyan)" }} />}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
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
            const expired = Date.now() > +new Date(e.starts_at) + TWO_H;
            const clickable = !!e.live_url && !expired;
            const hora = new Date(e.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", height: 150,
                  background: t?.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,#132038,#0b1020)" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(5,5,7,.92),rgba(5,5,7,.1) 70%)" }} />
                  <div style={{ position: "absolute", left: 16, right: 16, bottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{e.title}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.75)", marginTop: 2 }}>{hora}{t ? ` · ${t.name}` : ""}</div>
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  {e.description && <p className="muted" style={{ fontSize: 13, flex: 1, margin: 0 }}>{e.description}</p>}
                  <span style={{ flex: e.description ? "unset" : 1 }} />
                  {clickable ? (
                    <a className="btn btn-primary" href={e.live_url!} target="_blank" rel="noreferrer" style={{ padding: "9px 16px", fontSize: 13 }}>Entrar a la clase</a>
                  ) : (
                    <span className="chip" style={{ color: expired ? "var(--muted-soft)" : "var(--f3)" }}>{expired ? "Clase finalizada" : "Enlace pendiente"}</span>
                  )}
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
