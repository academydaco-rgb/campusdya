"use client";
import type { ReactNode } from "react";

export type HeroStat = { b: ReactNode; s: string };

/**
 * Panel dorado reutilizable (mismo diseño que Casos de éxito / Profesores).
 * Se usa en todas las pestañas con contenido propio de cada sección.
 */
export default function SectionHero({
  badge, icon, title, subtitle, stats, variant, style,
}: {
  badge: string;
  icon?: ReactNode;
  title: string;
  subtitle: string;
  stats?: HeroStat[];
  variant?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`ce-hero${variant ? " " + variant : ""}`} style={{ marginBottom: 22, ...style }}>
      <div className="ce-hero-glow" />
      <div className="ce-hero-stars" />
      <div className="ce-hero-in">
        <span className="ce-badge">{icon}{badge}</span>
        <h1 className="ce-title">{title}</h1>
        <p className="ce-sub">{subtitle}</p>
        {stats && stats.length > 0 && (
          <div className="ce-stats">
            {stats.map((st, i) => (
              <div className="ce-stat" key={i}>
                <b>{st.b}</b>
                <span>{st.s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
