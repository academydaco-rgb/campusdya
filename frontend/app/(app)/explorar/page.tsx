"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UniverseT, DiplomaCardT } from "@/lib/api";
import Reveal from "@/components/Reveal";

export default function Explorar() {
  const router = useRouter();
  const [data, setData] = useState<UniverseT | null>(null);
  useEffect(() => { api.get<UniverseT>("/api/phases").then(setData).catch(() => setData(null)); }, []);

  function open(d: DiplomaCardT) { if (d.enrolled) router.push(`/diplomado/${d.slug}`); }

  return (
    <div>
      <div className="fade-up">
        <h1>Tu ruta de aprendizaje</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 620 }}>
          Cuatro fases para construir tu e-commerce rentable, paso a paso. Avanza por cada una y desbloquea tu siguiente nivel.
        </p>
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        {(data?.phases || []).map((p, i) => {
          const color = p.color || "var(--brand)";
          return (
            <Reveal key={p.id} delay={i * 60}>
            <div className="card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color }} />
              <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, background: `radial-gradient(circle, ${color}22, transparent 70%)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, color: "#05070d", background: color, boxShadow: `0 8px 24px ${color}55` }}>
                  {i + 1}
                </div>
                <div>
                  <h2 style={{ fontSize: 18 }}>{p.name}</h2>
                  <p className="muted" style={{ fontSize: 13, marginTop: 3 }}>{p.description}</p>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", marginTop: 18 }}>
                {p.diplomas.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Diplomados en preparación.</span>}
                {p.diplomas.map((d) => (
                  <div key={d.id} onClick={() => open(d)} className={`card card-hover ${d.enrolled ? "" : "lock"}`}
                    style={{ overflow: "hidden", cursor: d.enrolled ? "pointer" : "not-allowed", borderColor: d.enrolled ? "var(--line)" : "var(--line)" }}>
                    <div style={{ width: "100%", aspectRatio: "1 / 1", background: d.cover_url ? `center/cover url(${d.cover_url})` : `linear-gradient(135deg, ${color}44, var(--surface-3))` }} />
                    <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{d.title}</span>
                      {d.enrolled ? <span className="chip" style={{ color, borderColor: color, fontSize: 11 }}>Entrar</span> : <span title="Sin acceso">🔒</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </Reveal>
          );
        })}
        {data && data.phases.length === 0 && <div className="card" style={{ padding: 24 }}><span className="muted">Aún no hay fases configuradas.</span></div>}
      </div>
    </div>
  );
}
