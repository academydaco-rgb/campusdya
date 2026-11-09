"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight } from "lucide-react";
import SectionHero from "@/components/SectionHero";

export default function Herramientas() {
  const [items, setItems] = useState<ToolT[]>([]);
  useEffect(() => { api.get<ToolT[]>("/api/tools").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <SectionHero
        icon={<Wrench size={14} />}
        badge="Tu arsenal"
        title="Herramientas"
        subtitle="Las herramientas y recursos que usamos en la academia, listas para que las uses en tu negocio."
        stats={[{ b: items.length, s: "herramientas" }]}
      />
      <div className="grid-3">
        {items.map((t) => (
          <Tilt key={t.id} style={{ height: "100%" }}>
            <div className="toolcard">
              <div className="toolcard-img" style={{ background: t.image_url ? `center/cover url(${t.image_url})` : "linear-gradient(135deg,#1e1636,#0f0b1e)" }}>
                {!t.image_url && <Wrench size={34} style={{ color: "rgba(255,255,255,.5)" }} />}
              </div>
              <div className="toolcard-body">
                <div className="toolcard-title">{t.title}</div>
                {t.link_url && (
                  <a className="btn btn-primary toolcard-btn" href={t.link_url} target="_blank" rel="noreferrer">
                    {t.link_label || "Abrir"} <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Pronto verás herramientas aquí.</span>}
      </div>
    </div>
  );
}
