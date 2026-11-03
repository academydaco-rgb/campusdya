"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, DiplomaDetailT } from "@/lib/api";

export default function DiplomaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const [d, setD] = useState<DiplomaDetailT | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    api.get<DiplomaDetailT>(`/api/diplomas/${slug}`).then(setD).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="card" style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!d) return <span className="muted">Cargando…</span>;

  const t = d.teacher;

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div>
        <Link href="/explorar" className="muted" style={{ fontSize: 13 }}>← Explorar</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "#fff" }}>{d.title}</h1>
        {d.description && <p className="muted" style={{ marginTop: 6 }}>{d.description}</p>}
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 10, borderRadius: 999, background: "rgba(5,8,15,.6)", border: "1px solid var(--line)", overflow: "hidden" }}>
            <div style={{ width: `${d.progress}%`, height: "100%", background: "var(--grad)" }} />
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{d.completed_lessons}/{d.total_lessons} lecciones · {d.progress}% completado</div>
        </div>
      </div>

      {/* Profesor del diplomado */}
      {t && (
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, flexShrink: 0,
            background: t.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,var(--cyan),var(--indigo))" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Tu profesor</div>
            <div style={{ fontWeight: 800, color: "#fff" }}>{t.name}</div>
            {t.bio && <p className="muted" style={{ fontSize: 13, marginTop: 3 }}>{t.bio}</p>}
          </div>
          {t.whatsapp && (
            <a className="btn btn-wa" style={{ padding: "9px 14px", fontSize: 13, flexShrink: 0 }}
              href={`https://wa.me/${t.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.511 5.26l-.999 3.648 3.736-.978a9.86 9.86 0 00.24.141l.001.03zm5.303-6.411c-.075-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              WhatsApp
            </a>
          )}
        </div>
      )}

      {d.modules.map((m, mi) => (
        <div key={m.id} className="card" style={{ padding: 18 }}>
          {/* Cabecera del módulo: imagen cuadrada a la izquierda del título */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {m.cover_url && <div style={{ width: 88, height: 88, borderRadius: 12, flexShrink: 0, background: `center/cover url(${m.cover_url})` }} />}
            <div style={{ minWidth: 0 }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Módulo {mi + 1}</div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#fff", lineHeight: 1.2 }}>{m.title}</div>
              {m.description && <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{m.description}</div>}
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {m.lessons.map((l, li) => (
              <Link key={l.id} href={`/leccion/${l.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12,
                  border: "1px solid var(--line)", background: "rgba(5,8,15,.5)" }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                  background: l.completed ? "var(--f4)" : "var(--grad-soft)", color: l.completed ? "#04110b" : "var(--cyan)" }}>
                  {li + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{l.title}</span>
                {l.completed && <span style={{ color: "var(--f4)", fontSize: 12 }}>✓</span>}
                <span className="muted" style={{ fontSize: 12 }}>▶</span>
              </Link>
            ))}
            {m.lessons.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Sin lecciones todavía.</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
