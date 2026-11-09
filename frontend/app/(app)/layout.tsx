"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import Spotlight from "@/components/Spotlight";
import TopBar from "@/components/TopBar";
import OnlineBar from "@/components/OnlineBar";
import { Home, GraduationCap, CalendarDays, Video, Package, Award, Users, MessagesSquare,
  BookOpen, UserCog, KeyRound, Megaphone, ShieldCheck, Rocket, Trophy, Wrench, ExternalLink, Bell, type LucideIcon } from "lucide-react";

const APRENDER: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: Home },
  { href: "/explorar", label: "Mis Diplomados", Icon: GraduationCap },
  { href: "/classroom", label: "Classroom", Icon: CalendarDays },
  { href: "/clases-en-vivo", label: "Clases en vivo", Icon: Video },
  { href: "/herramientas", label: "Herramientas", Icon: Wrench },
  { href: "/proveedores", label: "Proveedores", Icon: Package },
  { href: "/profesores", label: "Profesores", Icon: Users },
  { href: "/feedback", label: "Comunidad", Icon: MessagesSquare },
  { href: "/insignias", label: "Insignias", Icon: Award },
  { href: "/casos-exito", label: "Casos de éxito", Icon: Trophy },
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
interface NavItem { href: string; label: string; Icon: LucideIcon; }

function Item({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link href={href} className={`nav-item${active ? " active" : ""}`}>
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="nav-pill"
          transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
        />
      )}
      <span className="ic"><Icon size={19} strokeWidth={2} /></span>
      <span className="nav-label-t">{label}</span>
    </Link>
  );
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
