"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Spotlight from "@/components/Spotlight";
import { Home, GraduationCap, CalendarDays, Video, Package, Award, Users, MessagesSquare, UserCircle,
  BookOpen, UserCog, KeyRound, Megaphone, ShieldCheck, LogOut, type LucideIcon } from "lucide-react";

const APRENDER: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: Home },
  { href: "/explorar", label: "Diplomados", Icon: GraduationCap },
  { href: "/classroom", label: "Classroom", Icon: CalendarDays },
  { href: "/clases-en-vivo", label: "Clases en vivo", Icon: Video },
  { href: "/proveedores", label: "Proveedores", Icon: Package },
  { href: "/insignias", label: "Insignias", Icon: Award },
  { href: "/profesores", label: "Profesores", Icon: Users },
  { href: "/feedback", label: "Comunidad", Icon: MessagesSquare },
  { href: "/perfil", label: "Mi perfil", Icon: UserCircle },
];
const ADMIN: NavItem[] = [
  { href: "/admin/diplomados", label: "Diplomados", Icon: BookOpen },
  { href: "/admin/usuarios", label: "Usuarios", Icon: UserCog },
  { href: "/admin/inscripciones", label: "Inscripciones", Icon: KeyRound },
  { href: "/admin/profesores", label: "Profesores", Icon: Users },
  { href: "/admin/clases-en-vivo", label: "Clases en vivo", Icon: Video },
  { href: "/admin/proveedores", label: "Proveedores", Icon: Package },
  { href: "/admin/classroom", label: "Classroom", Icon: CalendarDays },
  { href: "/admin/comunicados", label: "Comunicados", Icon: Megaphone },
  { href: "/admin/moderacion", label: "Moderación", Icon: ShieldCheck },
];
interface NavItem { href: string; label: string; Icon: LucideIcon; }

function Item({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return <Link href={href} className={`nav-item${active ? " active" : ""}`}><span className="ic"><Icon size={18} strokeWidth={2} /></span>{label}</Link>;
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
      <Spotlight />
      <aside className="sidebar">
        <Link href="/dashboard" className="brand" style={{ justifyContent: "flex-start", padding: "6px 8px" }}><img src="/logo.png" alt="D&A Academy" style={{ width: 180, maxWidth: "100%", height: "auto", objectFit: "contain" }} /></Link>

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
            <div style={{ width: 34, height: 34, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, color: "#04141c", background: user.avatar_url ? `center/cover url(${user.avatar_url})` : "var(--grad)" }}>
              {!user.avatar_url && (user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 11 }}>{isAdmin ? "Administrador" : "Alumno"}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={() => { logout(); router.replace("/login"); }}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
