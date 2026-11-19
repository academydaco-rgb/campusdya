"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight } from "lucide-react";
import SectionHero from "@/components/SectionHero";

const CATS = [
  { acc: "#00ffff" },
  { acc: "#d946ef" },
  { acc: "#fb7185" },
  { acc: "#22e67a" },
  { acc: "#f6c453" },
  { acc: "#8b5cf6" },
];

function hostOf(u?: string | null) {
  if (!u) return "";
  try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; }
}

/** Separa "LOBO LANDING: IA para Landing Page" -> nombre + descriptor. */
function splitTitle(title: string) {
  const i = title.indexOf(":");
  if (i > 0 && i < title.length - 1) {
    return { name: title.slice(0, i).trim(), desc: title.slice(i + 1).trim() };
  }
  return { name: title.trim(), desc: "" };
}

function Ic({ img, host, letter, acc }: { img?: string | null; host: string; letter: string; acc: string }) {
  const [err, setErr] = useState(false);
  if (img) return <span className="hl-ic" style={{ backgroundImage: `url(${img})` }} />;
  if (host && !err)
    return (
      <span className="hl-ic" style={{ background: `color-mix(in srgb, ${acc} 16%, #0e0a22)` }}>
        <img loading="lazy" decoding="async" src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" onError={() => setErr(true)} />
      </span>
    );
  return (
    <span className="hl-ic" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${acc} 55%, #2a1550), ${acc})` }}>
      <span className="hl-ltr">{letter}</span>
    </span>
  );
}

function Globe() {
  return (
    <svg className="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
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
        subtitle="Todas las plataformas, agentes de IA y recursos de la academia en un solo lugar. Elige una y ábrela al instante."
        stats={[{ b: items.length, s: "herramientas" }, { b: onlyGeneral ? 1 : groups.length, s: "categorías" }]}
      />

      {items.length === 0 && <span className="muted">Pronto verás herramientas aquí.</span>}

      {groups.map(([cat, tools], gi) => {
        const c = CATS[gi % CATS.length];
        return (
          <section className="hl-sec" key={cat} style={{ ["--acc" as string]: c.acc }}>
            {!onlyGeneral && (
              <div className="hl-head">
                <span className="hl-dot" />
                <h2 className="hl-title">{cat}</h2>
                <span className="hl-cnt">{tools.length}</span>
                <span className="hl-line" />
              </div>
            )}
            <div className="hl-grid">
              {tools.map((t) => {
                const host = hostOf(t.link_url);
                const { name, desc } = splitTitle(t.title);
                const sub = desc || host;
                const inner = (
                  <>
                    <Ic img={t.image_url} host={host} letter={name.charAt(0).toUpperCase()} acc={c.acc} />
                    <div className="hl-body">
                      <div className="hl-name">{name}</div>
                      {sub && <div className="hl-host">{!desc && <Globe />}{sub}</div>}
                    </div>
                    {t.link_url && <span className="hl-go"><ArrowUpRight size={17} /></span>}
                  </>
                );
                return t.link_url ? (
                  <a key={t.id} className="hl-tile" style={{ ["--acc" as string]: c.acc }} href={t.link_url} target="_blank" rel="noreferrer">{inner}</a>
                ) : (
                  <div key={t.id} className="hl-tile hl-tile-nolink" style={{ ["--acc" as string]: c.acc }}>{inner}</div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
