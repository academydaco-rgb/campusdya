"use client";
import { useEffect, useState } from "react";
import { api, TeacherT } from "@/lib/api";

export default function Profesores() {
  const [items, setItems] = useState<TeacherT[]>([]);
  useEffect(() => { api.get<TeacherT[]>("/api/teachers").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Profesores 🎓</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>El equipo que te acompaña en tu camino.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {items.map((t) => (
          <div key={t.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, overflow: "hidden", background: t.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,var(--brand),var(--cyan))" }} />
              <div><div style={{ fontWeight: 700 }}>{t.name}</div></div>
            </div>
            {t.bio && <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{t.bio}</p>}
            {t.whatsapp && (
              <a className="btn btn-primary" style={{ marginTop: 12, padding: "8px 14px", fontSize: 13 }}
                href={`https://wa.me/${t.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                💬 WhatsApp
              </a>
            )}
          </div>
        ))}
        {items.length === 0 && <span className="muted">Pronto verás a tus profesores aquí.</span>}
      </div>
    </div>
  );
}
