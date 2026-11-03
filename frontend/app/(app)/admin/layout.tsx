"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const SUB = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/diplomados", label: "Diplomados" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/inscripciones", label: "Inscripciones" },
  { href: "/admin/profesores", label: "Profesores" },
  { href: "/admin/clases-en-vivo", label: "Clases en vivo" },
  { href: "/admin/classroom", label: "Classroom" },
  { href: "/admin/moderacion", label: "Moderación" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  if (user && user.role === "alumno") {
    return <div className="card" style={{ padding: 24 }}>No tienes acceso al panel de administración.</div>;
  }
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Administración</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {SUB.map((s) => {
          const active = pathname === s.href;
          return (
            <Link key={s.href} href={s.href} className="badge-pill"
              style={{ borderColor: active ? "var(--cyan)" : "var(--border)", color: active ? "var(--cyan)" : "var(--muted)" }}>
              {s.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
