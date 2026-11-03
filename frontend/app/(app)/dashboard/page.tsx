"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DiplomaOutT, UniverseT, AnnouncementT, ScheduleT, MyBadgeT, FeedbackT } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function fdate(d: string) {
  try { return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); } catch { return ""; }
}
function fdatetime(d: string) {
  try { return new Date(d).toLocaleString("es-CO", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [mine, setMine] = useState<DiplomaOutT[]>([]);
  const [universe, setUniverse] = useState<UniverseT | null>(null);
  const [news, setNews] = useState<AnnouncementT[]>([]);
  const [events, setEvents] = useState<ScheduleT[]>([]);
  const [badges, setBadges] = useState<MyBadgeT[]>([]);
  const [feedback, setFeedback] = useState<FeedbackT[]>([]);

  useEffect(() => {
    api.get<DiplomaOutT[]>("/api/me/diplomas").then(setMine).catch(() => {});
    api.get<UniverseT>("/api/phases").then(setUniverse).catch(() => {});
    api.get<AnnouncementT[]>("/api/announcements").then(setNews).catch(() => {});
    api.get<ScheduleT[]>("/api/classroom").then(setEvents).catch(() => {});
    api.get<MyBadgeT[]>("/api/me/badges").then(setBadges).catch(() => {});
    api.get<FeedbackT[]>("/api/feedback").then(setFeedback).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] || "crack";
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 2 * 3600 * 1000).slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Hero */}
      <section className="hero fade-up">
        <img src="/logo.png" alt="" style={{ position: "absolute", right: 18, bottom: -18, width: 190, opacity: .09, pointerEvents: "none" }} />
        <div className="chip" style={{ background: "transparent", borderColor: "var(--line-2)" }}>D&A Academy</div>
        <h1 style={{ marginTop: 14, fontSize: "clamp(26px,3.6vw,40px)", maxWidth: 640 }}>Hola, {firstName}. Hoy avanzas un paso más. 🚀</h1>
        <p className="muted" style={{ marginTop: 10, maxWidth: 540 }}>Tu ruta para construir un e-commerce rentable: aprende, ejecuta y escala, todo desde un solo lugar.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/explorar" className="btn btn-primary">Continuar aprendiendo</Link>
          <Link href="/classroom" className="btn btn-ghost">Ver mis clases</Link>
        </div>
      </section>

      <div className="dash">
        {/* Columna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Comunicados */}
          {news.length > 0 && (
            <section className="fade-up d1">
              <div className="wh"><h2>Comunicados</h2></div>
              <div className="grid" style={{ gap: 12 }}>
                {news.map((n) => (
                  <article key={n.id} className="card" style={{ overflow: "hidden", display: "flex", gap: 0, flexDirection: n.image_url ? "column" : "row" }}>
                    {n.image_url && <div style={{ height: 150, background: `center/cover url(${n.image_url})` }} />}
                    <div style={{ padding: 18 }}>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{n.body}</p>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>{fdate(n.created_at)}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Mis diplomados */}
          <section className="fade-up d2">
            <div className="wh"><h2>Mis diplomados</h2><Link href="/explorar">Explorar todo</Link></div>
            {mine.length === 0 ? (
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontWeight: 700 }}>Aún no tienes diplomados asignados.</div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Cuando tengas acceso, aparecerán aquí para que retomes donde quedaste.</p>
              </div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))" }}>
                {mine.map((d) => (
                  <Link key={d.id} href={`/diplomado/${d.slug}`} className="card card-hover" style={{ overflow: "hidden" }}>
                    <div style={{ aspectRatio: "1/1", background: d.cover_url ? `center/cover url(${d.cover_url})` : "var(--grad)" }} />
                    <div style={{ padding: 14, fontWeight: 700, fontSize: 14 }}>{d.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Ruta de ejecución */}
          <section className="fade-up d3">
            <div className="wh"><h2>Ruta de ejecución</h2><Link href="/explorar">Ver fases</Link></div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              {(universe?.phases || []).map((p, i) => {
                const color = p.color || "var(--cyan)";
                return (
                  <Link key={p.id} href="/explorar" className="card card-hover" style={{ padding: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", fontWeight: 800, color: "#04121a", background: color }}>{i + 1}</div>
                    <div style={{ fontWeight: 700, marginTop: 10, fontSize: 13.5 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{p.diplomas.length} diplomado{p.diplomas.length === 1 ? "" : "s"}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Próximas clases */}
          <section className="fade-up d1">
            <div className="wh"><h2>Próximas clases</h2><Link href="/classroom">Calendario</Link></div>
            <div className="card" style={{ padding: 8 }}>
              {upcoming.length === 0 ? <div style={{ padding: 16 }} className="muted">No hay clases programadas.</div> :
                upcoming.map((e) => (
                  <div key={e.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{fdatetime(e.starts_at)}</div>
                    </div>
                    {e.live_url && <a className="chip" href={e.live_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", fontSize: 11 }}>Entrar</a>}
                  </div>
                ))}
            </div>
          </section>

          {/* Insignias */}
          <section className="fade-up d2">
            <div className="wh"><h2>Mis insignias</h2><Link href="/insignias">Ver todas</Link></div>
            <div className="card" style={{ padding: 18 }}>
              {badges.length === 0 ? <span className="muted" style={{ fontSize: 13 }}>Completa un diplomado para ganar tu primera insignia.</span> :
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {badges.slice(0, 6).map((b) => (
                    <div key={b.id} title={b.name} style={{ fontSize: 34, filter: "drop-shadow(0 0 14px var(--cyan))" }}>{b.icon || "🏅"}</div>
                  ))}
                </div>}
            </div>
          </section>

          {/* Comunidad */}
          <section className="fade-up d3">
            <div className="wh"><h2>Comunidad</h2><Link href="/feedback">Participar</Link></div>
            <div className="grid" style={{ gap: 10 }}>
              {feedback.slice(0, 2).map((f) => (
                <div key={f.id} className="card" style={{ padding: 14 }}>
                  <div style={{ color: "var(--f3)", fontSize: 13 }}>{"★".repeat(f.rating || 5)}</div>
                  <p style={{ fontSize: 13.5, marginTop: 6 }}>{f.body}</p>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>— {f.author_name || "Alumno"}</div>
                </div>
              ))}
              {feedback.length === 0 && <div className="card" style={{ padding: 16 }}><span className="muted" style={{ fontSize: 13 }}>Sé el primero en compartir tu experiencia.</span></div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
