"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight, Layers } from "lucide-react";
import SectionHero from "@/components/SectionHero";

const CATS = [
  { grad: "linear-gradient(135deg,#22e0ff,#6d5efc)", tint: "34,224,255" },
  { grad: "linear-gradient(135deg,#d946ef,#7c3aed)", tint: "217,70,239" },
  { grad: "linear-gradient(135deg,#fb7185,#d946ef)", tint: "251,113,133" },
  { grad: "linear-gradient(135deg,#22e67a,#22e0ff)", tint: "34,230,122" },
  { grad: "linear-gradient(135deg,#f6c453,#fb7185)", tint: "246,196,83" },
  { grad: "linear-gradient(135deg,#8b5cf6,#22e0ff)", tint: "139,92,246" },
];

function hostOf(u?: string | null) {
  if (!u) return "";
  try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; }
}

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
        subtitle="Todas las plataformas y recursos de la academia, organizados por categoría. Toca una tarjeta para abrirla."
        stats={[{ b: items.length, s: "herramientas" }, { b: onlyGeneral ? 1 : groups.length, s: "categorías" }]}
      />

      {items.length === 0 && <span className="muted">Pronto verás herramientas aquí.</span>}

      {groups.map(([cat, tools], gi) => {
        const c = CATS[gi % CATS.length];
        return (
          <section
            className="toolcat-block"
            key={cat}
            style={{
              background: `linear-gradient(160deg, rgba(${c.tint},.11), rgba(${c.tint},.025) 58%, rgba(10,8,20,.35))`,
              borderColor: `rgba(${c.tint},.30)`,
            }}
          >
            {!onlyGeneral && (
              <div className="toolcat-head">
                <span className="toolcat-ic" style={{ background: c.grad }}><Layers size={20} /></span>
                <div className="toolcat-meta">
                  <h2 className="toolcat-title">{cat}</h2>
                  <span className="toolcat-count">{tools.length} {tools.length === 1 ? "herramienta" : "herramientas"}</span>
                </div>
              </div>
            )}
            <div className="tool2-grid">
              {tools.map((t) => {
                const host = hostOf(t.link_url);
                const common = (
                  <>
                    <span className="tool2-ic" style={t.image_url ? { backgroundImage: `url(${t.image_url})` } : { background: c.grad }}>
                      {!t.image_url && t.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="tool2-main">
                      <span className="tool2-title">{t.title}</span>
                      {host && <span className="tool2-host">{host}</span>}
                    </span>
                    {t.link_url && <ArrowUpRight size={17} className="tool2-arrow" />}
                  </>
                );
                return t.link_url ? (
                  <a key={t.id} className="tool2" href={t.link_url} target="_blank" rel="noreferrer">{common}</a>
                ) : (
                  <div key={t.id} className="tool2 tool2-nolink">{common}</div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
