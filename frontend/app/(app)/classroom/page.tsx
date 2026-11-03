"use client";
import { useEffect, useState } from "react";
import { api, ScheduleT } from "@/lib/api";

function fmt(d: string) {
  try { return new Date(d).toLocaleString("es-CO", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
}

export default function Classroom() {
  const [events, setEvents] = useState<ScheduleT[]>([]);
  useEffect(() => { api.get<ScheduleT[]>("/api/classroom").then(setEvents).catch(() => setEvents([])); }, []);
  const now = Date.now();
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Classroom 📅</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Tu calendario de clases en vivo.</p>
      <div className="grid" style={{ gap: 10 }}>
        {events.map((e) => {
          const upcoming = new Date(e.starts_at).getTime() >= now;
          return (
            <div key={e.id} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, borderColor: upcoming ? "var(--brand)" : "var(--border)" }}>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 22 }}>{upcoming ? "🟣" : "✓"}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{e.title}</div>
                {e.description && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{e.description}</div>}
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{fmt(e.starts_at)}</div>
              </div>
              {e.live_url && <a className="btn btn-primary" href={e.live_url} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", fontSize: 13 }}>Entrar</a>}
            </div>
          );
        })}
        {events.length === 0 && <div className="card" style={{ padding: 24 }}><span className="muted">No hay clases programadas aún.</span></div>}
      </div>
    </div>
  );
}
