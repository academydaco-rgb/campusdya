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

  return (
    <div className="grid" style={{ gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>Hola, {user?.name?.split(" ")[0] || "crack"} 👋</h1>
        <p className="muted" style={{ marginTop: 6 }}>Tu ruta de ejecución para construir tu e-commerce rentable.</p>
      </div>

      {/* Ruta de ejecución: las 4 fases */}
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Ruta de ejecución</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {(universe?.phases || []).map((p) => (
            <Link key={p.id} href="/universo" className="card" style={{ padding: 18, display: "block" }}>
              <div style={{ fontSize: 26 }}>{p.icon || "🪐"}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{p.description}</div>
              <div className="badge-pill" style={{ marginTop: 12, color: p.color || "var(--brand)", borderColor: "var(--border)" }}>
                {p.diplomas.length} diplomado{p.diplomas.length === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mis diplomados */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>Mis diplomados</h2>
          <Link href="/universo" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>Explorar universo →</Link>
        </div>
        {mine.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            <span className="muted">Aún no tienes diplomados asignados. Explora el universo y pide acceso.</span>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {mine.map((d) => (
              <Link key={d.id} href={`/diplomado/${d.slug}`} className="card" style={{ overflow: "hidden", display: "block" }}>
                <div style={{ height: 120, background: d.cover_url ? `center/cover url(${d.cover_url})` : "linear-gradient(135deg,#1a1033,#0b1020)" }} />
                <div style={{ padding: 16, fontWeight: 700 }}>{d.title}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
