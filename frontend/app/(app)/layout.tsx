"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const APRENDER = [
  { href: "/dashboard", label: "Inicio", ic: "◆" },
  { href: "/explorar", label: "Diplomados", ic: "◈" },
  { href: "/classroom", label: "Classroom", ic: "▣" },
  { href: "/clases-en-vivo", label: "Clases en vivo", ic: "▶" },
  { href: "/insignias", label: "Insignias", ic: "✦" },
  { href: "/profesores", label: "Profesores", ic: "◉" },
  { href: "/feedback", label: "Comunidad", ic: "✶" },
];
const ADMIN = [
  { href: "/admin/diplomados", label: "Diplomados", ic: "▤" },
  { href: "/admin/usuarios", label: "Usuarios", ic: "◎" },
  { href: "/admin/inscripciones", label: "Inscripciones", ic: "⚿" },
  { href: "/admin/profesores", label: "Profesores", ic: "◉" },
  { href: "/admin/clases-en-vivo", label: "Clases en vivo", ic: "▶" },
  { href: "/admin/classroom", label: "Classroom", ic: "▣" },
  { href: "/admin/comunicados", label: "Comunicados", ic: "✸" },
  { href: "/admin/moderacion", label: "Moderación", ic: "⚑" },
];

function Item({ href, label, ic, active }: { href: string; label: string; ic: string; active: boolean }) {
  return <Link href={href} className={`nav-item${active ? " active" : ""}`}><span className="ic">{ic}</span>{label}</Link>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="main"><span className="muted">Cargando…</span></div>;

  const isAdmin = user.role === "admin" || user.role === "instructor";
  const match = (h: string) => pathname === h || pathname.startsWith(h + "/");

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand" style={{ justifyContent: "center", padding: "6px 8px" }}><img src="/logo.png" alt="D&A Academy" style={{ width: 128, maxWidth: "100%", height: "auto", objectFit: "contain" }} /></Link>

        <div className="nav-group">
          {APRENDER.map((n) => <Item key={n.href} {...n} active={match(n.href)} />)}
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-label">Administración</div>
            {ADMIN.map((n) => <Item key={n.href} {...n} active={match(n.href)} />)}
          </div>
        )}

        <div style={{ marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 10px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--grad)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 11 }}>{isAdmin ? "Administrador" : "Alumno"}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={() => { logout(); router.replace("/login"); }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
