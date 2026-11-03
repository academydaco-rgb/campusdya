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
      <div className="grid-3">
        {items.map((t) => (
          <div key={t.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", paddingTop: "100%",
              background: t.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,var(--cyan),var(--indigo))" }}>
              {!t.photo_url && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 40, color: "#04121a", fontWeight: 800 }}>{t.name.charAt(0)}</span>}
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 15 }}>{t.name}</div>
              {t.bio && <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, flex: 1 }}>{t.bio}</p>}
              {t.whatsapp && (
                <a className="btn btn-wa" style={{ marginTop: 4, padding: "9px 14px", fontSize: 13, justifyContent: "center" }}
                  href={`https://wa.me/${t.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.511 5.26l-.999 3.648 3.736-.978a9.86 9.86 0 00.24.141l.001.03zm5.303-6.411c-.075-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Pronto verás a tus profesores aquí.</span>}
      </div>
    </div>
  );
}
