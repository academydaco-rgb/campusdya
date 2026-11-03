"use client";
import Link from "next/link";

const CARDS = [
  { href: "/admin/diplomados", icon: "🎓", title: "Diplomados", desc: "Crea diplomados, asigna fase, y gestiona módulos y lecciones." },
  { href: "/admin/usuarios", icon: "👥", title: "Usuarios", desc: "Crea usuarios o impórtalos masivamente (migración CSV)." },
  { href: "/admin/inscripciones", icon: "🔑", title: "Inscripciones", desc: "Da acceso de un usuario a un diplomado (permisos)." },
];

export default function AdminHome() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
      {CARDS.map((c) => (
        <Link key={c.href} href={c.href} className="card" style={{ padding: 20, display: "block" }}>
          <div style={{ fontSize: 26 }}>{c.icon}</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>{c.title}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.desc}</div>
        </Link>
      ))}
    </div>
  );
}
