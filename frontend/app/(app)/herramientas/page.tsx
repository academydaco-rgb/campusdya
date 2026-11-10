"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight } from "lucide-react";
import SectionHero from "@/components/SectionHero";

function hostOf(u?: string | null) {
  if (!u) return "";
  try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; }
}

function Fav({ img, host, letter }: { img?: string | null; host: string; letter: string }) {
  const [err, setErr] = useState(false);
  if (img) return <span className="tl-fav" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />;
  if (host && !err) return <span className="tl-fav"><img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" onError={() => setErr(true)} /></span>;
  return <span className="tl-fav"><span className="tl-fav-ltr">{letter}</span></span>;
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

      {groups.map(([cat, tools]) => (
        <section className="tl-sec" key={cat}>
          {!onlyGeneral && (
            <div className="tl-sec-head">
              <h2 className="tl-sec-title">{cat}</h2>
              <span className="tl-sec-count">{tools.length}</span>
            </div>
          )}
          <div className="tl-grid">
            {tools.map((t) => {
              const host = hostOf(t.link_url);
              const inner = (
                <>
                  <Fav img={t.image_url} host={host} letter={t.title.charAt(0).toUpperCase()} />
                  <span className="tl-main">
                    <span className="tl-name">{t.title}</span>
                    {host && <span className="tl-host">{host}</span>}
                  </span>
                  {t.link_url && <ArrowUpRight size={16} className="tl-arr" />}
                </>
              );
              return t.link_url ? (
                <a key={t.id} className="tl-card" href={t.link_url} target="_blank" rel="noreferrer">{inner}</a>
              ) : (
                <div key={t.id} className="tl-card tl-card-nolink">{inner}</div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
