"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UniverseT, DiplomaCardT } from "@/lib/api";
import Reveal from "@/components/Reveal";
import Ring from "@/components/Ring";
import Tilt from "@/components/Tilt";
import SectionHero from "@/components/SectionHero";
import { GraduationCap } from "lucide-react";

export default function Explorar() {
  const router = useRouter();
  const [data, setData] = useState<UniverseT | null>(null);
  useEffect(() => { api.get<UniverseT>("/api/phases").then(setData).catch(() => setData(null)); }, []);

  function open(d: DiplomaCardT) { if (d.enrolled) router.push(`/diplomado/${d.slug}`); }

  const _ph = data?.phases || [];
  const _dips = _ph.flatMap((p) => p.diplomas);
  const _enr = _dips.filter((d) => d.enrolled);
  const _avg = _enr.length ? Math.round(_enr.reduce((a, d) => a + (d.progress || 0), 0) / _enr.length) : 0;
  return (
    <div>
      <SectionHero
        icon={<GraduationCap size={14} />}
        badge="Tu ruta de aprendizaje"
        title="Mis Diplomados"
        subtitle="Cuatro fases para construir tu e-commerce rentable, paso a paso. Avanza por cada una y desbloquea tu siguiente nivel."
        stats={[{ b: _enr.length, s: "diplomados activos" }, { b: `${_avg}%`, s: "progreso promedio" }, { b: _ph.length, s: "fases" }]}
      />

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
                  <Tilt key={d.id} style={{ height: "100%" }}>
                  <div onClick={() => open(d)} className={`card card-hover ${d.enrolled ? "" : "lock"}`}
                    style={{ width: "100%", height: "100%", overflow: "hidden", cursor: d.enrolled ? "pointer" : "not-allowed", borderColor: d.enrolled ? "var(--line)" : "var(--line)" }}>
                    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: d.cover_url ? `center/cover url(${d.cover_url})` : `linear-gradient(135deg, ${color}44, var(--surface-3))` }}>
                      {d.enrolled && typeof d.progress === "number" && (
                        <div style={{ position: "absolute", top: 10, right: 10, borderRadius: 999, padding: 3, background: "rgba(5,8,14,.6)", backdropFilter: "blur(2px)" }}>
                          <Ring value={d.progress} size={42} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{d.title}</span>
                      {d.enrolled ? <span className="chip" style={{ color, borderColor: color, fontSize: 11 }}>Entrar</span> : <span title="Sin acceso">🔒</span>}
                    </div>
                  </div>
                  </Tilt>
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
