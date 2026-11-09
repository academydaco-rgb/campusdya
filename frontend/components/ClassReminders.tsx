"use client";
import { useEffect, useState } from "react";
import { api, ScheduleT } from "@/lib/api";
import { getReminders } from "@/lib/reminders";
import { Bell } from "lucide-react";

type Toast = { id: string; title: string; body: string };
const LEAD = 15 * 60 * 1000; // avisar 15 min antes

/**
 * Programador de recordatorios de clase. Montado en el layout, funciona en
 * cualquier pestaña abierta de la plataforma: 15 min antes de una clase con
 * recordatorio activo dispara una notificación del navegador + aviso en la app.
 */
export default function ClassReminders() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const drop = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    let events: ScheduleT[] = [];
    let stopped = false;
    let notified: Set<string>;
    try { notified = new Set(JSON.parse(localStorage.getItem("classRemNotified") || "[]")); } catch { notified = new Set(); }
    const persist = () => { try { localStorage.setItem("classRemNotified", JSON.stringify([...notified])); } catch {} };

    const loadEvents = async () => { try { events = await api.get<ScheduleT[]>("/api/classroom"); } catch {} };
    loadEvents();
    const reload = setInterval(loadEvents, 5 * 60 * 1000);

    const fire = (e: ScheduleT, start: number) => {
      const hora = new Date(start).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const mins = Math.max(1, Math.round((start - Date.now()) / 60000));
      const body = `Empieza en ${mins} min (a las ${hora}). El enlace se comparte en tu grupo de WhatsApp.`;
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`⏰ ${e.title}`, { body, icon: "/logo.png" });
        }
      } catch {}
      const tid = `${e.id}@${start}`;
      setToasts((t) => (t.some((x) => x.id === tid) ? t : [...t, { id: tid, title: e.title, body }]));
      setTimeout(() => drop(tid), 22000);
    };

    const check = () => {
      if (stopped) return;
      const ids = new Set(getReminders());
      const now = Date.now();
      for (const e of events) {
        if (!ids.has(e.id)) continue;
        const start = +new Date(e.starts_at);
        const key = `${e.id}@${e.starts_at}`;
        if (notified.has(key)) continue;
        const diff = start - now;
        if (diff > 0 && diff <= LEAD) { fire(e, start); notified.add(key); persist(); }
      }
    };
    const warm = setTimeout(check, 3000);
    const tick = setInterval(check, 30 * 1000);
    return () => { stopped = true; clearTimeout(warm); clearInterval(tick); clearInterval(reload); };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="rem-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="rem-toast">
          <span className="rem-toast-ic"><Bell size={17} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="rem-toast-title">{t.title}</div>
            <div className="rem-toast-body">{t.body}</div>
          </div>
          <button className="rem-toast-x" onClick={() => drop(t.id)} aria-label="Cerrar">×</button>
        </div>
      ))}
    </div>
  );
}
