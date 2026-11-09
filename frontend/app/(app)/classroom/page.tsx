"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ScheduleT, TeacherT } from "@/lib/api";
import SectionHero from "@/components/SectionHero";
import { CalendarDays, Bell } from "lucide-react";
import { getReminders, toggleReminder } from "@/lib/reminders";

const WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const TWO_H = 2 * 60 * 60 * 1000;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtHora(d: Date) {
  const hh = d.getHours(), mm = d.getMinutes();
  const h12 = ((hh + 11) % 12) + 1;
  return { hm: `${h12}:${String(mm).padStart(2, "0")}`, ap: hh < 12 ? "a.m." : "p.m." };
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
  const _ml = cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const monthLabel = _ml.charAt(0).toUpperCase() + _ml.slice(1);

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

  const [remOn, setRemOn] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setRemOn(new Set(getReminders()));
    sync();
    window.addEventListener("class-reminders-changed", sync);
    return () => window.removeEventListener("class-reminders-changed", sync);
  }, []);
  async function toggleRem(id: string) {
    if (!remOn.has(id)) {
      try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch {}
    }
    toggleReminder(id);
  }

  return (
    <div>
      <SectionHero
        icon={<CalendarDays size={14} />}
        badge="Tu calendario"
        title="Classroom"
        subtitle="Tu calendario de clases en vivo. El enlace de cada clase se envía por el grupo de WhatsApp."
        stats={[{ b: events.length, s: "clases programadas" }]}
      />

      {/* Calendario */}
      <div className="cal-card">
        <div className="cal-head">
          <h2 className="cal-month">{monthLabel}</h2>
          <div className="cal-ctrls">
            <button className="cal-nav" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior">←</button>
            <button className="cal-today" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(n); }}>Hoy</button>
            <button className="cal-nav" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente">→</button>
          </div>
        </div>

        <div className="calgrid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 7 }}>
          {WEEK.map((w) => <div key={w} className="cal-wd">{w}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const evs = eventsOf(day);
            const isToday = sameDay(day, today);
            const isSel = sameDay(day, selected);
            return (
              <button key={i} onClick={() => setSelected(day)} className={`cal-cell${isToday ? " is-today" : ""}${isSel ? " is-sel" : ""}`}>
                <span className="cal-num">{day.getDate()}</span>
                {evs.length > 0 && (
                  <div className="cal-dots">
                    {evs.slice(0, 3).map((e) => {
                      const t = e.teacher_id ? teachers[e.teacher_id] : undefined;
                      const expired = Date.now() > +new Date(e.starts_at) + TWO_H;
                      return t?.photo_url
                        ? <span key={e.id} className="cal-av" style={{ backgroundImage: `url(${t.photo_url})`, opacity: expired ? .45 : 1 }} />
                        : <span key={e.id} className="cal-dot" style={{ background: expired ? "var(--muted-soft)" : "var(--cyan)" }} />;
                    })}
                    {evs.length > 3 && <span className="cal-more">+{evs.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div style={{ marginTop: 22 }}>
        <h2 className="cl-dayhead">
          {(() => { const d = selected.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" }); return d.charAt(0).toUpperCase() + d.slice(1); })()}
          {selEvents.length > 0 && <span className="cl-count">{selEvents.length} {selEvents.length === 1 ? "clase" : "clases"}</span>}
        </h2>
        <div className="cl-list">
          {selEvents.map((e) => {
            const t = e.teacher_id ? teachers[e.teacher_id] : undefined;
            const { hm, ap } = fmtHora(new Date(e.starts_at));
            return (
              <div key={e.id} className="cl-item">
                <div className="cl-time"><b>{hm}</b><span>{ap}</span></div>
                <div className="cl-av" style={t?.photo_url ? { backgroundImage: `url(${t.photo_url})` } : { background: "var(--grad)" }}>
                  {!t?.photo_url && (t?.name?.charAt(0).toUpperCase() || "📚")}
                </div>
                <div className="cl-body">
                  <div className="cl-title">{e.title}</div>
                  {t && <div className="cl-teacher">con {t.name}</div>}
                  {e.description && <p className="cl-desc">{e.description}</p>}
                  <div className="cl-wa-banner">
                    <span className="cl-wa-ic"><svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5z"/></svg></span>
                    <span>El enlace de esta clase se comparte en tu <b>grupo de WhatsApp</b>.</span>
                  </div>
                </div>
                {(() => {
                  const future = +new Date(e.starts_at) > Date.now();
                  const on = remOn.has(e.id);
                  return future ? (
                    <button className={`cl-bell${on ? " on" : ""}`} onClick={() => toggleRem(e.id)} title="Notificarme 15 min antes">
                      <Bell size={15} /> {on ? "Te avisaré" : "Notificarme"}
                    </button>
                  ) : null;
                })()}
              </div>
            );
          })}
          {selEvents.length === 0 && <div className="card" style={{ padding: 22, textAlign: "center" }}><span className="muted">No hay clases este día.</span></div>}
        </div>
      </div>
    </div>
  );
}
