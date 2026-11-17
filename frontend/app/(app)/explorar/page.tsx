"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UniverseT, DiplomaCardT } from "@/lib/api";
import Reveal from "@/components/Reveal";
import Tilt from "@/components/Tilt";
import SectionHero from "@/components/SectionHero";
import { GraduationCap, ArrowRight, Check, Lock } from "lucide-react";

/** Anillo de progreso con el color de acento de la fase. */
function ProgRing({ value, acc }: { value: number; acc: string }) {
  const r = 19, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="dring">
      <svg width="46" height="46">
        <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="4" />
        <circle cx="23" cy="23" r={r} fill="none" stroke={acc} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="pct">{value}%</span>
    </div>
  );
}

function DiplomaCard({ d, color }: { d: DiplomaCardT; color: string }) {
  const router = useRouter();
  const locked = !d.enrolled;
  const prog = d.progress ?? 0;
  const done = d.enrolled && prog >= 100;
  const started = d.enrolled && prog > 0 && prog < 100;
  const acc = done ? "#34d399" : color;
  const cover = d.cover_url ? `url(${d.cover_url})` : `linear-gradient(135deg, ${color}66, #1a1630)`;
  const lessons = d.total_lessons || 0;

  const meta = locked ? "Sin acceso" : done ? `${lessons} lecciones · completado` : `${lessons} lecciones`;
  const cta = locked ? "Sin acceso" : done ? "Completado" : started ? "Continuar" : "Empezar";

  return (
    <div onClick={() => d.enrolled && router.push(`/diplomado/${d.slug}`)}
      className={`dcard ${locked ? "lock" : ""} ${done ? "done" : ""}`}
      style={{ ["--acc" as string]: acc }}>
      <div className="dcover">
        <div className="img" style={{ background: `center/cover no-repeat ${cover}` }} />
        {!locked && !done && <span className="dtag">{started ? "En curso" : "Nuevo"}</span>}
        {started && <ProgRing value={prog} acc={color} />}
        {done && <div className="done-badge"><Check size={16} strokeWidth={3.5} /></div>}
        {locked && <div className="lockico"><Lock size={24} /></div>}
      </div>
      <div className="dbody">
        <h4 className="dtitle">{d.title}</h4>
        <div className="dmeta">{meta}</div>
        <div className="dbar"><i style={{ width: `${locked ? 0 : prog}%` }} /></div>
        <div className={`dcta ${done ? "done" : ""}`}>
          <span>{cta}</span>
          {locked ? null : done ? <Check size={15} strokeWidth={3} /> : <ArrowRight size={15} />}
        </div>
      </div>
    </div>
  );
}

export default function Explorar() {
  const [data, setData] = useState<UniverseT | null>(null);
  useEffect(() => { api.get<UniverseT>("/api/phases").then(setData).catch(() => setData(null)); }, []);

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
          const n = p.diplomas.length;
          return (
            <Reveal key={p.id} delay={i * 60}>
            <div className="phase-block" style={{ ["--acc" as string]: color }}>
              <div className="phase-bar" />
              <div className="phase-glow" />
              <div className="phase-head">
                <div className="phase-num">{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <h2 className="phase-title">
                    {p.name}
                    {n > 0 && <span className="phase-count">{n} {n === 1 ? "diplomado" : "diplomados"}</span>}
                  </h2>
                  {p.description && <p className="phase-desc">{p.description}</p>}
                </div>
              </div>
              <div className="dip-grid">
                {n === 0 && <span className="muted" style={{ fontSize: 13 }}>Diplomados en preparación.</span>}
                {p.diplomas.map((d) => (
                  <Tilt key={d.id} style={{ height: "100%" }}>
                    <DiplomaCard d={d} color={color} />
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
