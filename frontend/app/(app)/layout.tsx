"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Spotlight from "@/components/Spotlight";
import TopBar from "@/components/TopBar";
import OnlineBar from "@/components/OnlineBar";
import { Home, GraduationCap, CalendarDays, Video, Package, Award, Users, MessagesSquare,
  BookOpen, UserCog, KeyRound, Megaphone, ShieldCheck, Rocket, Trophy, Wrench, ExternalLink, Bell, type LucideIcon } from "lucide-react";

const APRENDER: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: Home },
  { href: "/explorar", label: "Mis Diplomados", Icon: GraduationCap },
  { href: "/clases-en-vivo", label: "Clases en vivo", Icon: Video },
  { href: "/casos-exito", label: "Casos de éxito", Icon: Trophy },
  { href: "/herramientas", label: "Herramientas", Icon: Wrench },
  { href: "/proveedores", label: "Proveedores", Icon: Package },
  { href: "/classroom", label: "Classroom", Icon: CalendarDays },
  { href: "/insignias", label: "Insignias", Icon: Award },
  { href: "/feedback", label: "Comunidad", Icon: MessagesSquare },
  { href: "/profesores", label: "Profesores", Icon: Users },
];
const ADMIN: NavItem[] = [
  { href: "/admin/diplomados", label: "Diplomados", Icon: BookOpen },
  { href: "/admin/usuarios", label: "Usuarios", Icon: UserCog },
  { href: "/admin/inscripciones", label: "Inscripciones", Icon: KeyRound },
  { href: "/admin/profesores", label: "Profesores", Icon: Users },
  { href: "/admin/clases-en-vivo", label: "Clases en vivo", Icon: Video },
  { href: "/admin/casos-exito", label: "Casos de éxito", Icon: Trophy },
  { href: "/admin/herramientas", label: "Herramientas", Icon: Wrench },
  { href: "/admin/proveedores", label: "Proveedores", Icon: Package },
  { href: "/admin/classroom", label: "Classroom", Icon: CalendarDays },
  { href: "/admin/comunicados", label: "Comunicados", Icon: Megaphone },
  { href: "/admin/notificaciones", label: "Notificaciones", Icon: Bell },
  { href: "/admin/moderacion", label: "Moderación", Icon: ShieldCheck },
];
// Ícono de lobo (D&A) — lucide no trae wolf
function Wolf({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 3.5l3.8 3.4" />
      <path d="M20.5 3.5l-3.8 3.4" />
      <path d="M7.3 6.9C6 8.7 5.3 10.6 5.3 12.7c0 1.4.4 2.7 1.2 3.8L12 21l5.5-4.5c.8-1.1 1.2-2.4 1.2-3.8 0-2.1-.7-4-2-5.8" />
      <path d="M9.2 11.6l1.3 1.1" />
      <path d="M14.8 11.6l-1.3 1.1" />
      <path d="M12 14.6l-1.5 1.8h3L12 14.6z" />
    </svg>
  );
}

interface NavItem { href: string; label: string; Icon: LucideIcon; }

function Item({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return <Link href={href} className={`nav-item${active ? " active" : ""}`}><span className="ic"><Icon size={19} strokeWidth={2} /></span>{label}</Link>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="main"><span className="muted">Cargando…</span></div>;

  const isAdmin = user.role === "admin" || user.role === "instructor";
  const match = (h: string) => pathname === h || pathname.startsWith(h + "/");

  return (
    <div className="shell">
      <Spotlight />
      <div className="grain" aria-hidden />
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/logo.png" alt="D&A Academy" /></Link>

        <div className="nav-group">
          {APRENDER.map((n) => <Item key={n.href} {...n} active={match(n.href)} />)}
          <a href="https://dyalaunchsystem.com" target="_blank" rel="noreferrer" className="nav-item nav-launch">
            <span className="ic"><Rocket size={19} strokeWidth={2} /></span>D&A Launch System<ExternalLink size={14} style={{ marginLeft: "auto", opacity: .7 }} />
          </a>
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-label">Administración</div>
            {ADMIN.map((n) => <Item key={n.href} {...n} active={match(n.href)} />)}
          </div>
        )}

        <div className="promo">
          <div className="crown"><Wolf size={30} /></div>
          <h4 className="promo-title">Tú tienes derecho al acompañamiento personalizado</h4>
          <p className="promo-sub">Solicítalo aquí</p>
          <Link href="/profesores" className="promo-cta">Profesores</Link>
          <div className="planet" />
        </div>
      </aside>
      <main className="main">
        <TopBar />
        {children}
        <OnlineBar />
      </main>
    </div>
  );
}
