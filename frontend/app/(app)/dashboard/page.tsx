"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DiplomaOutT, AnnouncementT, ScheduleT, MyBadgeT } from "@/lib/api";
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
  const [news, setNews] = useState<AnnouncementT[]>([]);
  const [events, setEvents] = useState<ScheduleT[]>([]);
  const [badges, setBadges] = useState<MyBadgeT[]>([]);

  useEffect(() => {
    api.get<DiplomaOutT[]>("/api/me/diplomas").then(setMine).catch(() => {});
    api.get<AnnouncementT[]>("/api/announcements").then(setNews).catch(() => {});
    api.get<ScheduleT[]>("/api/classroom").then(setEvents).catch(() => {});
    api.get<MyBadgeT[]>("/api/me/badges").then(setBadges).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] || "crack";
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 2 * 3600 * 1000)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)).slice(0, 4);
  const misDiplomas = mine.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Hero */}
      <section className="hero fade-up">
        <img src="/logo.png" alt="" style={{ position: "absolute", right: 22, bottom: -20, width: 180, opacity: .12, pointerEvents: "none", zIndex: 1 }} />
        <span className="eyebrow-gold">D&A Academy · Acceso premium</span>
        <h1 style={{ marginTop: 12, fontSize: "clamp(26px,3.6vw,40px)", maxWidth: 640, color: "#fff" }}>Hola, {firstName}. Hoy avanzas un paso más 🚀</h1>
        <p style={{ marginTop: 10, maxWidth: 540, color: "rgba(255,255,255,.72)" }}>Aprende, ejecuta y escala tu e-commerce. Todo tu progreso, en un solo lugar.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/explorar" className="btn btn-primary">Continuar aprendiendo</Link>
          <Link href="/classroom" className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>Ver mis clases</Link>
        </div>
      </section>

      {/* Stats bento */}
      <div className="grid-3 fade-up d1">
        <div className="card stat">
          <span className="n" style={{ color: "var(--cyan)" }}>{mine.length}</span>
          <span className="l">Diplomados activos</span>
        </div>
        <div className="card stat">
          <span className="n" style={{ color: "var(--gold)" }}>{badges.length}</span>
          <span className="l">Insignias ganadas</span>
        </div>
        <div className="card stat">
          <span className="n" style={{ color: "var(--cyan)", fontSize: upcoming[0] ? 18 : 26 }}>{upcoming[0] ? fdatetime(upcoming[0].starts_at) : "—"}</span>
          <span className="l">Próxima clase</span>
        </div>
      </div>

      <div className="dash">
        {/* Columna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Mis diplomados (máx 4, los inscritos) */}
          <section className="fade-up d2">
            <div className="wh"><h2>Mis diplomados</h2><Link href="/explorar">Ver todos</Link></div>
            {misDiplomas.length === 0 ? (
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontWeight: 700 }}>Aún no tienes diplomados asignados.</div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Cuando tengas acceso, aparecerán aquí para que retomes donde quedaste.</p>
              </div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
                {misDiplomas.map((d) => (
                  <Link key={d.id} href={`/diplomado/${d.slug}`} className="card card-hover" style={{ overflow: "hidden" }}>
                    <div style={{ aspectRatio: "1/1", background: d.cover_url ? `center/cover url(${d.cover_url})` : "var(--grad)" }} />
                    <div style={{ padding: 14, fontWeight: 700, fontSize: 14, color: "#fff" }}>{d.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Noticias importantes */}
          <section className="fade-up d3">
            <div className="wh"><h2>Noticias importantes</h2></div>
            {news.length === 0 ? (
              <div className="card" style={{ padding: 20 }}><span className="muted" style={{ fontSize: 13.5 }}>No hay noticias por ahora. Aquí verás los comunicados de la academia.</span></div>
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                {news.map((n) => (
                  <article key={n.id} className="card card-hover" style={{ overflow: "hidden", display: "flex", gap: 0 }}>
                    {n.image_url && <div style={{ width: 120, flexShrink: 0, aspectRatio: "1 / 1", background: `center/cover url(${n.image_url})` }} />}
                    <div style={{ padding: 18, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 19, color: "#fff", lineHeight: 1.2 }}>{n.title}</div>
                      <p className="muted" style={{ fontSize: 13.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{n.body}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                        {n.teacher_name && (
                          <>
                            <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, background: n.teacher_photo_url ? `center/cover url(${n.teacher_photo_url})` : "var(--grad)" }} />
                            <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{n.teacher_name}</span>
                            <span className="muted" style={{ fontSize: 11 }}>·</span>
                          </>
                        )}
                        <span className="eyebrow" style={{ letterSpacing: ".1em" }}>{fdate(n.created_at)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Columna lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Próximas clases */}
          <section className="fade-up d1">
            <div className="wh"><h2>Próximas clases</h2><Link href="/classroom">Calendario</Link></div>
            <div className="card" style={{ padding: 8 }}>
              {upcoming.length === 0 ? <div style={{ padding: 16 }} className="muted">No hay clases programadas.</div> :
                upcoming.map((e) => {
                  const expired = now > +new Date(e.starts_at) + 2 * 3600 * 1000;
                  return (
                    <div key={e.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, alignItems: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{fdatetime(e.starts_at)}</div>
                      </div>
                      {e.live_url && !expired && <a className="chip" href={e.live_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", fontSize: 11 }}>Entrar</a>}
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Insignias */}
          <section className="fade-up d2">
            <div className="wh"><h2>Mis insignias</h2><Link href="/insignias">Ver todas</Link></div>
            <div className="card" style={{ padding: 18 }}>
              {badges.length === 0 ? <span className="muted" style={{ fontSize: 13 }}>Completa un diplomado para ganar tu primera insignia.</span> :
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {badges.slice(0, 6).map((b) => (
                    b.image_url
                      ? <img key={b.id} src={b.image_url} alt={b.name} title={b.name} style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 12px var(--gold))" }} />
                      : <div key={b.id} title={b.name} style={{ fontSize: 52, lineHeight: 1, filter: "drop-shadow(0 0 14px var(--gold))" }}>{b.icon || "🏅"}</div>
                  ))}
                </div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
