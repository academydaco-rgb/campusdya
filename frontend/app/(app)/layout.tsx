"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", built: true },
  { href: "/universo", label: "Universo", icon: "🌌", built: true },
  { href: "/classroom", label: "Classroom", icon: "📅", built: true },
  { href: "/clases-en-vivo", label: "En vivo", icon: "🎥", built: true },
  { href: "/insignias", label: "Insignias", icon: "🏅", built: true },
  { href: "/profesores", label: "Profesores", icon: "🎓", built: true },
  { href: "/feedback", label: "Comunidad", icon: "💬", built: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="container" style={{ padding: 60 }}><span className="muted">Cargando…</span></div>;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(12px)",
        background: "rgba(5,6,10,.7)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}>
          <Link href="/dashboard" style={{ fontWeight: 800, fontSize: 18 }}>
            Academia <span style={{ color: "var(--brand)" }}>D&A</span>
          </Link>
          <nav style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              const base: React.CSSProperties = {
                display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px",
                borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                color: active ? "#fff" : "var(--muted)",
                background: active ? "rgba(168,85,247,.15)" : "transparent",
                border: `1px solid ${active ? "var(--brand)" : "transparent"}`,
              };
              if (!n.built) {
                return <span key={n.href} style={{ ...base, opacity: .45, cursor: "not-allowed" }} title="Próximamente">
                  <span>{n.icon}</span>{n.label}</span>;
              }
              return <Link key={n.href} href={n.href} style={base}><span>{n.icon}</span>{n.label}</Link>;
            })}
          </nav>
          {user.role !== "alumno" && (
            <Link href="/admin" className="badge-pill" style={{ color: "var(--cyan)", borderColor: "var(--cyan)" }}>Admin</Link>
          )}
          <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => { logout(); router.replace("/login"); }}>
            Salir
          </button>
        </div>
      </header>
      <main className="container" style={{ padding: "28px 20px 60px" }}>{children}</main>
    </div>
  );
}
