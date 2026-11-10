"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Search, Bell, ChevronDown, UserCircle, LogOut, X, ExternalLink } from "lucide-react";

type SearchRes = { type: string; title: string; url: string; subtitle?: string | null };
type Notif = { id: string; title: string; body: string; image_url?: string | null; link_url?: string | null; link_label?: string | null; created_at?: string | null; read: boolean };

function fdate(d?: string | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); } catch { return ""; }
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchRes[] | null>(null);
  const [openRes, setOpenRes] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [view, setView] = useState<Notif | null>(null);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Buscador
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) { setRes(null); return; }
    const id = setTimeout(() => {
      api.get<SearchRes[]>(`/api/search?q=${encodeURIComponent(t)}`)
        .then((r) => { setRes(r); setOpenRes(true); })
        .catch(() => setRes([]));
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  // Notificaciones: contador al entrar + cada 60s
  useEffect(() => {
    let alive = true;
    const load = () => api.get<{ count: number }>("/api/notifications/unread_count").then((r) => { if (alive) setUnread(r.count || 0); }).catch(() => {});
    load();
    const iv = setInterval(load, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenRes(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggleNotif() {
    const next = !openNotif;
    setOpenNotif(next);
    if (next) {
      api.get<Notif[]>("/api/notifications").then(setNotifs).catch(() => setNotifs([]));
      if (unread > 0) api.post("/api/notifications/mark_read").then(() => setUnread(0)).catch(() => {});
    }
  }

  function go(url: string) { setOpenRes(false); setQ(""); router.push(url); }
  const isAdmin = user?.role === "admin" || user?.role === "instructor";

  return (
    <div className="topbar">
      <div className="searchbar" ref={wrapRef}>
        <Search aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => res && setOpenRes(true)} placeholder="Buscar clases, módulos o recursos…" aria-label="Buscar" />
        {openRes && res && (
          <div className="search-res">
            {res.length === 0 ? (
              <div className="search-empty">Sin resultados para “{q.trim()}”.</div>
            ) : (
              res.map((r, i) => (
                <a key={i} onClick={() => go(r.url)} role="button">
                  <span className="ty">{r.type}</span>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {r.title}{r.subtitle ? <span className="muted" style={{ fontSize: 12 }}> · {r.subtitle}</span> : null}
                  </span>
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Campana */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button className={`bell${unread > 0 ? " has-unread" : ""}`} aria-label="Notificaciones" type="button" onClick={toggleNotif}>
          <Bell />
          {unread > 0 && <span className="nbadge">{unread > 9 ? "9+" : unread}</span>}
        </button>
        {openNotif && (
          <div className="notifpanel">
            <div className="notifhead"><b>Notificaciones</b><button onClick={() => setOpenNotif(false)} aria-label="Cerrar"><X size={16} /></button></div>
            <div className="notiflist">
              {notifs.length === 0 ? (
                <div className="search-empty">No tienes notificaciones.</div>
              ) : (
                notifs.map((n) => (
                  <button key={n.id} type="button" className={`notifitem${n.read ? "" : " unread"}`} onClick={() => { setView(n); setOpenNotif(false); }}>
                    {n.image_url && <div className="nimg" style={{ background: `center/cover url(${n.image_url})` }} />}
                    <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!n.read && <span className="ndot" />}
                        <b style={{ fontSize: 13.5, color: "#fff" }}>{n.title}</b>
                        <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>{fdate(n.created_at)}</span>
                      </div>
                      <p className="notifitem-body" style={{ fontSize: 12.5, margin: "4px 0 0" }}>{n.body}</p>
                      <span className="notifitem-cta">{n.link_label || "Ver"} →</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {view && (
        <div className="notifmodal-ov" onClick={() => setView(null)}>
          <div className="notifmodal" onClick={(e) => e.stopPropagation()}>
            {view.image_url && <img src={view.image_url} alt="" className="notifmodal-img" />}
            <div className="notifmodal-in">
              <button className="notifmodal-x" onClick={() => setView(null)} aria-label="Cerrar"><X size={18} /></button>
              <span className="eyebrow" style={{ color: "#c9b7ff" }}>Comunicado</span>
              <h2 className="notifmodal-title">{(view.title || "").replace(/^📣\s*/, "")}</h2>
              <div className="muted" style={{ fontSize: 12.5, margin: "8px 0 14px" }}>{fdate(view.created_at)}</div>
              <p className="notifmodal-body">{view.body}</p>
              {/^https?:\/\//i.test(view.link_url || "") && (
                <a className="btn btn-primary" href={view.link_url!} target="_blank" rel="noreferrer" style={{ marginTop: 16, alignSelf: "flex-start" }}>
                  {view.link_label || "Abrir"} <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usuario */}
      <div className="userchip" ref={menuRef} onClick={() => setOpenMenu((v) => !v)} role="button" style={{ cursor: "pointer" }}>
        <span className="av" style={user?.avatar_url ? { background: `center/cover url(${user.avatar_url})` } : undefined}>
          {!user?.avatar_url && (user?.name || "U").charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120, display: "block" }}>{user?.name}</b>
          <span>{isAdmin ? "Administrador" : "Estudiante"}</span>
        </div>
        <ChevronDown size={16} style={{ color: "#9aa0c0" }} />
        {openMenu && (
          <div className="usermenu" onClick={(e) => e.stopPropagation()}>
            <Link href="/perfil" onClick={() => setOpenMenu(false)}><UserCircle size={16} /> Mi perfil</Link>
            <button type="button" onClick={() => { logout(); router.replace("/login"); }}><LogOut size={16} /> Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}
