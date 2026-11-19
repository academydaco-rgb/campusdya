"use client";
import { useEffect, useState } from "react";
import { api, ScheduleT, TeacherT } from "@/lib/api";
import { Video } from "lucide-react";

type Toast = {
  id: string;
  title: string;
  teacherLine: string;
  photo?: string | null;
  letter: string;
  liveUrl?: string | null;
  whenLabel: string;
  msToStart: number;
};

const LEAD = 5 * 60 * 1000; // avisar 5 min antes

function WaIcon() {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden>
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5z" />
    </svg>
  );
}

/**
 * Aviso de clase a punto de empezar. Montado en el layout, corre en cualquier
 * pestaña abierta: 5 min antes de cada clase muestra automáticamente una
 * notificación bonita (+ notificación del navegador si el alumno dio permiso)
 * con el botón para entrar. El enlace sale del campo live_url de la clase.
 */
export default function ClassReminders() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const drop = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    let events: ScheduleT[] = [];
    let teachers: Record<string, TeacherT> = {};
    let stopped = false;
    let notified: Set<string>;
    try { notified = new Set(JSON.parse(localStorage.getItem("classRemNotified") || "[]")); } catch { notified = new Set(); }
    const persist = () => { try { localStorage.setItem("classRemNotified", JSON.stringify([...notified])); } catch {} };

    const load = async () => {
      try { events = await api.get<ScheduleT[]>("/api/classroom"); } catch {}
      try {
        const ts = await api.get<TeacherT[]>("/api/teachers");
        const map: Record<string, TeacherT> = {};
        ts.forEach((t) => { map[t.id] = t; });
        teachers = map;
      } catch {}
    };
    load();
    const reload = setInterval(load, 5 * 60 * 1000);

    const fire = (e: ScheduleT, start: number) => {
      const hora = new Date(start).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const mins = Math.max(1, Math.round((start - Date.now()) / 60000));
      const t = e.teacher_id ? teachers[e.teacher_id] : undefined;
      const teacherLine = (t?.name ? `con ${t.name} · ` : "") + hora;
      const letter = (t?.name || e.title).charAt(0).toUpperCase();
      const whenLabel = mins <= 1 ? "Empieza ya" : `Empieza en ${mins} min`;

      try {
        if ("Notification" in window && Notification.permission === "granted") {
          const body = e.live_url
            ? `Empieza en ${mins} min. Toca para entrar a la clase.`
            : `Empieza en ${mins} min. El enlace se comparte en tu grupo de WhatsApp.`;
          const n = new Notification(`🟢 ${e.title}`, { body, icon: "/logo.png" });
          if (e.live_url) n.onclick = () => { try { window.open(e.live_url as string, "_blank"); } catch {} };
        }
      } catch {}

      const tid = `${e.id}@${start}`;
      setToasts((prev) =>
        prev.some((x) => x.id === tid)
          ? prev
          : [...prev, { id: tid, title: e.title, teacherLine, photo: t?.photo_url, letter, liveUrl: e.live_url, whenLabel, msToStart: Math.max(10000, start - Date.now()) }]
      );
      // se auto-cierra ~3 min despues de que inicie la clase
      setTimeout(() => drop(tid), Math.max(30000, start - Date.now()) + 3 * 60 * 1000);
    };

    const check = () => {
      if (stopped) return;
      const now = Date.now();
      for (const e of events) {
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
    <div className="cn-stack">
      {toasts.map((t) => (
        <div key={t.id} className="cn">
          <button className="cn-x" onClick={() => drop(t.id)} aria-label="Cerrar">×</button>
          <div className="cn-top">
            <span className="cn-live"><span className="cn-pulse" />En vivo ya casi</span>
            <span className="cn-when">{t.whenLabel}</span>
          </div>
          <div className="cn-mid">
            <span className="cn-av" style={t.photo ? { backgroundImage: `url(${t.photo})` } : { background: "linear-gradient(135deg,#6d28d9,#00ffff)" }}>
              {!t.photo && t.letter}
            </span>
            <div className="cn-info">
              <div className="cn-title">{t.title}</div>
              <div className="cn-teacher">{t.teacherLine}</div>
            </div>
          </div>
          {t.liveUrl ? (
            <a className="cn-cta" href={t.liveUrl} target="_blank" rel="noreferrer">
              <Video size={17} /> Entrar a la clase
            </a>
          ) : (
            <div className="cn-wa-note"><WaIcon /> El enlace se comparte en tu grupo de WhatsApp.</div>
          )}
          <div className="cn-bar" style={{ animationDuration: `${t.msToStart}ms` }} />
        </div>
      ))}
    </div>
  );
}
