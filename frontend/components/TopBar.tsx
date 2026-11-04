"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Search, Bell, ChevronDown, UserCircle, LogOut } from "lucide-react";

type SearchRes = { type: string; title: string; url: string; subtitle?: string | null };

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchRes[] | null>(null);
  const [openRes, setOpenRes] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenRes(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(url: string) { setOpenRes(false); setQ(""); router.push(url); }
  const isAdmin = user?.role === "admin" || user?.role === "instructor";

  return (
    <div className="topbar">
      <div className="searchbar" ref={wrapRef}>
        <Search aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => res && setOpenRes(true)}
          placeholder="Buscar clases, módulos o recursos…"
          aria-label="Buscar"
        />
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

      <button className="bell dot" aria-label="Notificaciones" type="button">
        <Bell />
      </button>

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
