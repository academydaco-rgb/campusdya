"use client";
import { useEffect, useMemo, useState } from "react";
import Tilt from "@/components/Tilt";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight, Layers } from "lucide-react";
import SectionHero from "@/components/SectionHero";

const ACCENTS = [
  "linear-gradient(135deg,#22e0ff,#6d5efc)",
  "linear-gradient(135deg,#d946ef,#7c3aed)",
  "linear-gradient(135deg,#fb7185,#d946ef)",
  "linear-gradient(135deg,#22e67a,#22e0ff)",
  "linear-gradient(135deg,#f6c453,#fb7185)",
  "linear-gradient(135deg,#8b5cf6,#22e0ff)",
];

export default function Herramientas() {
  const [items, setItems] = useState<ToolT[]>([]);
  useEffect(() => { api.get<ToolT[]>("/api/tools").then(setItems).catch(() => setItems([])); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ToolT[]>();
    for (const t of items) {
      const key = (t.category && t.category.trim()) || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [items]);

  const onlyGeneral = groups.length === 1 && groups[0][0] === "General";

  return (
    <div>
      <SectionHero
        icon={<Wrench size={14} />}
        badge="Tu arsenal"
        title="Herramientas"
        subtitle="Las herramientas y recursos que usamos en la academia, organizados por categoría y listos para tu negocio."
        stats={[{ b: items.length, s: "herramientas" }, { b: onlyGeneral ? 1 : groups.length, s: "categorías" }]}
      />

      {items.length === 0 && <span className="muted">Pronto verás herramientas aquí.</span>}

      {groups.map(([cat, tools], gi) => (
        <section className="toolcat" key={cat}>
          {!onlyGeneral && (
            <div className="toolcat-head">
              <span className="toolcat-ic" style={{ background: ACCENTS[gi % ACCENTS.length] }}><Layers size={20} /></span>
              <div className="toolcat-meta">
                <h2 className="toolcat-title">{cat}</h2>
                <span className="toolcat-count">{tools.length} {tools.length === 1 ? "herramienta" : "herramientas"}</span>
              </div>
            </div>
          )}
          <div className="grid-4">
            {tools.map((t) => (
              <Tilt key={t.id} style={{ height: "100%" }}>
                <div className="toolcard">
                  <div className="toolcard-img" style={{ background: t.image_url ? `center/cover url(${t.image_url})` : "linear-gradient(135deg,#1e1636,#0f0b1e)" }}>
                    {!t.image_url && <Wrench size={26} style={{ color: "rgba(255,255,255,.5)" }} />}
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
          </div>
        </section>
      ))}
    </div>
  );
}
