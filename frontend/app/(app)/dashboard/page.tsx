"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DiplomaOutT, AnnouncementT, ScheduleT, MyBadgeT, ContinueT } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Tilt from "@/components/Tilt";
import NewsBlock from "@/components/NewsBlock";
import TLink from "@/components/TLink";
import { GraduationCap, PlayCircle, TrendingUp, Award, Radio, MessagesSquare,
  Play, ChevronRight, Clock, ArrowRight } from "lucide-react";

function dayNum(d: string) { try { return new Date(d).toLocaleDateString("es-CO", { day: "2-digit" }); } catch { return ""; } }
function monNum(d: string) { try { return new Date(d).toLocaleDateString("es-CO", { month: "short" }).toUpperCase().replace(".", ""); } catch { return ""; } }
function htime(d: string) { try { return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }

export default function DashboardPage() {
  const { user } = useAuth();
  const [mine, setMine] = useState<DiplomaOutT[]>([]);
  const [news, setNews] = useState<AnnouncementT[]>([]);
  const [events, setEvents] = useState<ScheduleT[]>([]);
  const [badges, setBadges] = useState<MyBadgeT[]>([]);
  const [cont, setCont] = useState<ContinueT | null>(null);
  const [video, setVideo] = useState<{ video_url?: string | null; cover_url?: string | null } | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.get<DiplomaOutT[]>("/api/me/diplomas").then(setMine).catch(() => {});
    api.get<AnnouncementT[]>("/api/announcements").then(setNews).catch(() => {});
    api.get<ScheduleT[]>("/api/classroom").then(setEvents).catch(() => {});
    api.get<MyBadgeT[]>("/api/me/badges").then(setBadges).catch(() => {});
    api.get<ContinueT | null>("/api/me/continue").then(setCont).catch(() => {});
    api.get<{ video_url?: string | null; cover_url?: string | null }>("/api/settings/dashboard-video").then(setVideo).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] || "crack";
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 2 * 3600 * 1000)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const nextLive = upcoming[0];
  const nextLiveExpired = nextLive ? now > +new Date(nextLive.starts_at) + 2 * 3600 * 1000 : false;

  const totalLessons = mine.reduce((a, d) => a + (d.total_lessons || 0), 0);
  const doneLessons = mine.reduce((a, d) => a + (d.completed_lessons || 0), 0);
  const overall = totalLessons ? Math.round((100 * doneLessons) / totalLessons) : 0;

  const contDip = cont ? mine.find((d) => d.title === cont.diploma_title) : null;
  const minis = mine.filter((d) => !cont || d.title !== cont.diploma_title).slice(0, 2);
  const firstNews = news[0];

  const videoSrc = video?.video_url
    ? (playing ? (video.video_url.includes("?") ? `${video.video_url}&autoplay=1` : `${video.video_url}?autoplay=1`) : video.video_url)
    : null;

  return (
    <div>
      <div className="dashgrid">
        {/* ── Columna principal ── */}
        <div>
          {/* Hero */}
          <section className="hero fade-up">
            <div className="neb" /><div className="stars" /><div className="pl" />
            <div className="hc">
              <h1>Bienvenido, {firstName} <span className="cy">👋</span></h1>
              <p>Aquí es donde se construyen los sueños.</p>
              <Link className="cta" href={cont ? `/leccion/${cont.lesson_id}` : "/explorar"}>Continuar aprendiendo <ArrowRight size={16} /></Link>
            </div>
            <div className="hero-video">
              <span className="vtag"><Play size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> Video de bienvenida</span>
              {video?.video_url ? (
                playing || !video.cover_url ? (
                  <iframe src={videoSrc!} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                ) : (
                  <button className="play" style={{ backgroundImage: `url(${video.cover_url})` }} onClick={() => setPlaying(true)} aria-label="Reproducir video">
                    <span className="pbtn">▶</span>
                  </button>
                )
              ) : (
                <button className="play" onClick={() => {}} aria-label="Video de bienvenida" style={{ cursor: "default" }}>
                  <span className="pbtn">▶</span>
                </button>
              )}
            </div>
          </section>

          {/* Stats */}
          <div className="stats4 fade-up d1" style={{ marginTop: 18 }}>
            <Tilt className="card stile">
              <div className="row"><span className="si"><GraduationCap /></span><div><div className="lab">Diplomados activos</div><div className="num">{mine.length}</div></div></div>
              <div className="bar"><i style={{ width: `${Math.min(100, mine.length ? overall : 0)}%` }} /></div>
            </Tilt>
            <Tilt className="card stile">
              <div className="row"><span className="si"><PlayCircle /></span><div><div className="lab">Clases completadas</div><div className="num">{doneLessons} / {totalLessons}</div></div></div>
              <div className="bar"><i style={{ width: `${totalLessons ? Math.round(100 * doneLessons / totalLessons) : 0}%` }} /></div>
            </Tilt>
            <Tilt className="card stile">
              <div className="row"><span className="si"><TrendingUp /></span><div><div className="lab">Progreso general</div><div className="num">{overall}%</div></div></div>
              <div className="bar"><i style={{ width: `${overall}%` }} /></div>
            </Tilt>
            <Tilt className="card stile">
              <div className="row"><span className="si"><Award /></span><div><div className="lab">Insignias ganadas</div><div className="num">{badges.length}</div></div></div>
              <div className="bar"><i style={{ width: `${mine.length ? Math.min(100, Math.round(100 * badges.length / mine.length)) : (badges.length ? 100 : 0)}%` }} /></div>
            </Tilt>
          </div>

          {/* Continúa tu formación */}
          {(cont || mine.length > 0) && (
            <div className="sec fade-up d2">
              <div className="sec-h"><span className="ic"><PlayCircle /></span><h2>Continúa tu formación</h2><Link className="all" href="/explorar">Ver todos <ArrowRight size={14} /></Link></div>
              {cont && (
                <Link href={`/leccion/${cont.lesson_id}`} className="card card-hover" style={{ display: "flex", alignItems: "center", gap: 18, padding: 16, overflow: "hidden" }}>
                  <div style={{ width: 170, height: 104, borderRadius: 14, flex: "none", background: contDip?.cover_url ? `center/cover url(${contDip.cover_url})` : "linear-gradient(135deg,#2a1150,#0e1140)", border: "1px solid var(--line-2)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="chip" style={{ color: "#06202a", background: "linear-gradient(90deg,#22e0ff,#55f0c0)", border: 0, fontWeight: 700 }}>En curso</span>
                    <div style={{ fontWeight: 700, fontSize: 19, color: "#fff", margin: "8px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cont.diploma_title}</div>
                    <div className="muted" style={{ fontSize: 12.5, display: "flex", gap: 8, alignItems: "center", overflow: "hidden" }}><Play size={13} /> {cont.lesson_title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 6, background: "rgba(255,255,255,.08)", overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: `${cont.progress}%`, background: "var(--grad-cm)" }} /></div>
                      <b style={{ fontSize: 13 }}>{cont.progress}%</b>
                    </div>
                  </div>
                  <span style={{ width: 52, height: 52, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(124,58,237,.25)", border: "1px solid var(--line-2)", color: "#e5d5ff" }}><Play size={20} /></span>
                </Link>
              )}
              {minis.length > 0 && (
                <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", marginTop: 14 }}>
                  {minis.map((d) => (
                    <TLink key={d.id} href={`/diplomado/${d.slug}`} className="card card-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, flex: "none", background: d.cover_url ? `center/cover url(${d.cover_url})` : "rgba(124,58,237,.2)", border: "1px solid var(--line-2)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14, color: "#fff", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</b>
                        <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{d.completed_lessons || 0}/{d.total_lessons || 0} lecciones · {d.progress || 0}%</div>
                      </div>
                      <span style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "#cbb8ff" }}><ChevronRight size={18} /></span>
                    </TLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mis Diplomados (carrusel) */}
          <div className="sec fade-up d3">
            <div className="sec-h"><span className="ic"><GraduationCap /></span><h2>Mis Diplomados</h2><Link className="all" href="/explorar">Ver todos <ArrowRight size={14} /></Link></div>
            {mine.length === 0 ? (
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontWeight: 700 }}>Aún no tienes diplomados asignados.</div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Cuando tengas acceso, aparecerán aquí para que retomes donde quedaste.</p>
              </div>
            ) : (
              <div className="car">
                {mine.map((d) => (
                  <TLink key={d.id} href={`/diplomado/${d.slug}`} className="dcard card-hover">
                    <div className="cov" style={{ background: d.cover_url ? `center/cover url(${d.cover_url})` : "linear-gradient(135deg,#2a1150,#6d28d9)", viewTransitionName: `dip-${d.slug}` }}>
                    </div>
                    <div className="db">
                      <span className="t">{d.title}</span>
                      <div className="bar"><i style={{ width: `${d.progress || 0}%` }} /></div>
                      <span className="pct">{(d.completed_lessons || 0)}/{(d.total_lessons || 0)} lecciones</span>
                    </div>
                  </TLink>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Columna lateral ── */}
        <div className="rcol fade-up d1">
          {/* Mis Insignias */}
          <div className="card" style={{ padding: 18 }}>
            <div className="sec-h"><span className="ic"><Award /></span><h2>Mis Insignias</h2><Link className="all" href="/insignias">Ver todas <ArrowRight size={14} /></Link></div>
            {badges.length === 0 ? (
              <span className="muted" style={{ fontSize: 13 }}>Completa un diplomado para ganar tu primera insignia.</span>
            ) : (
              <div className="hexrow">
                {badges.slice(0, 3).map((b) => (
                  <div key={b.id}>
                    {b.image_url
                      ? <img src={b.image_url} alt={b.name} title={b.name} style={{ width: "100%", maxWidth: 92, aspectRatio: "1/1", objectFit: "contain", margin: "0 auto", display: "block", filter: "drop-shadow(0 6px 16px rgba(217,70,239,.4))" }} />
                      : <div className="hexb" title={b.name}><Award /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Noticias importantes */}
          <NewsBlock news={news} />

          {/* Próxima clase en vivo */}
          <div className="card" style={{ padding: 18 }}>
            <div className="sec-h"><span className="ic"><Radio /></span><h2>Próxima clase en vivo</h2></div>
            {!nextLive ? (
              <span className="muted" style={{ fontSize: 13 }}>No hay clases programadas por ahora.</span>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="datecal">
                    <div className="top"><i /><i /></div>
                    <div className="d">{dayNum(nextLive.starts_at)}</div>
                    <div className="m">{monNum(nextLive.starts_at)}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontSize: 15, color: "#fff", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextLive.title}</b>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}><Clock size={13} /> {htime(nextLive.starts_at)}</div>
                  </div>
                </div>
                {nextLive.live_url && !nextLiveExpired && (
                  <div style={{ textAlign: "right", marginTop: 14 }}>
                    <a className="btn btn-primary" href={nextLive.live_url} target="_blank" rel="noreferrer">Ingresar a la clase <ArrowRight size={15} /></a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Comunidad */}
          <div className="card" style={{ padding: 18 }}>
            <div className="sec-h"><span className="ic"><MessagesSquare /></span><h2>Comunidad</h2></div>
            <p className="muted" style={{ fontSize: 13, margin: "2px 0 14px", lineHeight: 1.5 }}>Comparte tus resultados y aprende de otros estudiantes de la academia.</p>
            <Link className="btn btn-primary" href="/feedback" style={{ width: "100%", justifyContent: "center" }}>Ir a la comunidad <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
