"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, DiplomaDetailT } from "@/lib/api";
import ProtectedVideo, { toEmbed } from "@/components/ProtectedVideo";

export default function DiplomaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const [d, setD] = useState<DiplomaDetailT | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  useEffect(() => {
    if (!slug) return;
    api.get<DiplomaDetailT>(`/api/diplomas/${slug}`).then(setD).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="card" style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!d) return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="skeleton" style={{ height: 30, width: 260 }} />
      <div className="skeleton" style={{ height: 14, width: 420, maxWidth: "80%" }} />
      {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
    </div>
  );

  const t = d.teacher;
  const video = toEmbed(d.intro_video_url);
  const bg = d.hero_image_url || d.cover_url;
  const wa = t?.whatsapp ? t.whatsapp.replace(/[^0-9]/g, "") : "";

  return (
    <div className="grid" style={{ gap: 22 }}>
      <Link href="/explorar" className="muted" style={{ fontSize: 13 }}>← Diplomados</Link>

      {/* ───── Cabecera estilo Netflix ───── */}
      <section className="nf-hero" style={{ viewTransitionName: `dip-${d.slug}` }}>
        <div className="nf-neb" /><div className="nf-stars" /><div className="nf-pl" /><div className="nf-pl2" />
        <div className="nf-hero-grid">
          <div className="nf-hero-info">
            <span className="nf-tag">Diplomado · Academy D&amp;A</span>
            <h1 className="nf-title">{d.title}</h1>
            {d.description && <p className="nf-desc">{d.description}</p>}
            {t && (
              <div className="nf-teacher">
                <div className="nf-teacher-ph" style={{ background: t.photo_url ? `center/cover url(${t.photo_url})` : "linear-gradient(135deg,var(--cyan),var(--indigo))" }} />
                <div style={{ minWidth: 0 }}>
                  <div className="nf-teacher-lbl">Tu profesor</div>
                  <div className="nf-teacher-name">{t.name}</div>
                </div>
                {wa && (
                  <a className="btn btn-wa" style={{ padding: "10px 16px", fontSize: 13.5, flexShrink: 0 }}
                    href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.3-5-3.7-10.5-6.5z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="nf-hero-media">
            {video ? (
              <ProtectedVideo url={d.intro_video_url} title={`Presentación ${d.title}`} poster={bg} />
            ) : (
              <div className="nf-hero-poster" style={{ background: bg ? `center/cover url(${bg})` : "var(--grad)" }} />
            )}
          </div>
        </div>
      </section>

      {/* ───── Barra de progreso ───── */}
      <div className="card nf-progress">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 16 }}>Tu avance en el diplomado</div>
          <div><span style={{ fontWeight: 800, fontSize: 22, color: "var(--cyan)" }}>{d.progress}%</span>
            <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>{d.completed_lessons}/{d.total_lessons} lecciones</span></div>
        </div>
        <div className="nf-bar"><div className="nf-bar-fill" style={{ width: `${d.progress}%` }} /></div>
      </div>

      {d.modules.map((m, mi) => (
        <div key={m.id} className={`card mod-acc${open[m.id] ? " is-open" : ""}`}>
          {/* Cabecera del módulo (clic para desplegar las lecciones) */}
          <button type="button" className="mod-head" onClick={() => toggle(m.id)} aria-expanded={!!open[m.id]}>
            <span className={`mod-ico mod-ico-${mi % 4}`} aria-hidden>
              <span className="mod-ico-num">{String(mi + 1).padStart(2, "0")}</span>
            </span>
            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Módulo {mi + 1}</div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#fff", lineHeight: 1.2 }}>{m.title}</div>
              {m.description && <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{m.description}</div>}
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                {m.lessons.length} {m.lessons.length === 1 ? "lección" : "lecciones"} · {m.lessons.filter((l) => l.completed).length} completadas
              </div>
            </div>
            <span className="mod-chev" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>

          <div className="mod-body"><div className="mod-inner">
          <div style={{ paddingTop: 14, display: "grid", gap: 8 }}>
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
          </div></div>
        </div>
      ))}
    </div>
  );
}

