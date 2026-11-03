"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DiplomaOutT, UniverseT } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [mine, setMine] = useState<DiplomaOutT[]>([]);
  const [universe, setUniverse] = useState<UniverseT | null>(null);

  useEffect(() => {
    api.get<DiplomaOutT[]>("/api/me/diplomas").then(setMine).catch(() => setMine([]));
    api.get<UniverseT>("/api/phases").then(setUniverse).catch(() => setUniverse(null));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "crack";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* Hero */}
      <section className="card fade-up" style={{ padding: "34px 30px", position: "relative", overflow: "hidden", border: "1px solid var(--line-2)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(500px 240px at 90% -20%, rgba(212,19,139,.25), transparent 60%)" }} />
        <div style={{ position: "relative" }}>
          <div className="chip" style={{ background: "transparent", borderColor: "var(--line-2)" }}>Campus D&A</div>
          <h1 style={{ marginTop: 14, fontSize: "clamp(28px,4vw,42px)" }}>Hola, {firstName}.<br />Construyamos tu e-commerce. 🚀</h1>
          <p className="muted" style={{ marginTop: 10, maxWidth: 560 }}>Sigue tu ruta de ejecución fase por fase. Todo lo que necesitas para lanzar y escalar, en un solo lugar.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/explorar" className="btn btn-primary">Continuar aprendiendo</Link>
            <Link href="/classroom" className="btn btn-ghost">Ver próximas clases</Link>
          </div>
        </div>
      </section>

      {/* Ruta de ejecución */}
      <section className="fade-up d1">
        <h2 style={{ marginBottom: 14 }}>Ruta de ejecución</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {(universe?.phases || []).map((p, i) => {
            const color = p.color || "var(--brand)";
            return (
              <Link key={p.id} href="/explorar" className="card card-hover" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, background: `radial-gradient(circle, ${color}22, transparent 70%)` }} />
                <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", fontWeight: 800, color: "#05070d", background: color }}>{i + 1}</div>
                <div style={{ fontWeight: 700, marginTop: 12 }}>{p.name}</div>
                <div className="chip" style={{ marginTop: 12, color, borderColor: "var(--line)" }}>{p.diplomas.length} diplomado{p.diplomas.length === 1 ? "" : "s"}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mis diplomados */}
      <section className="fade-up d2">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2>Mis diplomados</h2>
          <Link href="/explorar" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>Explorar todo</Link>
        </div>
        {mine.length === 0 ? (
          <div className="card" style={{ padding: 26 }}>
            <div style={{ fontWeight: 700 }}>Todavía no tienes diplomados asignados.</div>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Cuando tengas acceso, aparecerán aquí para que retomes donde quedaste.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {mine.map((d) => (
              <Link key={d.id} href={`/diplomado/${d.slug}`} className="card card-hover" style={{ overflow: "hidden" }}>
                <div style={{ height: 120, background: d.cover_url ? `center/cover url(${d.cover_url})` : "linear-gradient(135deg,var(--brand),var(--brand-2))" }} />
                <div style={{ padding: 16, fontWeight: 700 }}>{d.title}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
