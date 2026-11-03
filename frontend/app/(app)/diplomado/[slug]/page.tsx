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

  if (error) return <div className="card" style={{ padding: 24, color: "#fca5a5" }}>{error}</div>;
  if (!d) return <span className="muted">Cargando…</span>;

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div>
        <Link href="/explorar" className="muted" style={{ fontSize: 13 }}>← Explorar</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{d.title}</h1>
        {d.description && <p className="muted" style={{ marginTop: 6 }}>{d.description}</p>}
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 10, borderRadius: 999, background: "#0b0e17", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ width: `${d.progress}%`, height: "100%", background: "linear-gradient(90deg,var(--brand),var(--cyan))" }} />
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{d.completed_lessons}/{d.total_lessons} lecciones · {d.progress}% completado</div>
        </div>
      </div>

      {d.modules.map((m, mi) => (
        <div key={m.id} className="card" style={{ padding: 20 }}>
          {m.cover_url && <div style={{ aspectRatio: "16 / 9", borderRadius: 12, marginBottom: 14, background: `center/cover url(${m.cover_url})` }} />}
          <div style={{ fontWeight: 700, fontSize: 15 }}><span className="muted">Módulo {mi + 1} · </span>{m.title}</div>
          {m.description && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{m.description}</div>}
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {m.lessons.map((l, li) => (
              <Link key={l.id} href={`/leccion/${l.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "#0b0e17" }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 12,
                  background: l.completed ? "var(--green)" : "var(--panel-2)", color: l.completed ? "#04110b" : "var(--muted)" }}>
                  {l.completed ? "✓" : li + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{l.title}</span>
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
