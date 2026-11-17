"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ToolT } from "@/lib/api";
import { Wrench, ArrowUpRight } from "lucide-react";
import SectionHero from "@/components/SectionHero";

const CATS = [
  { acc: "#22e0ff", rgb: "34,224,255" },
  { acc: "#d946ef", rgb: "217,70,239" },
  { acc: "#fb7185", rgb: "251,113,133" },
  { acc: "#22e67a", rgb: "34,230,122" },
  { acc: "#f6c453", rgb: "246,196,83" },
  { acc: "#8b5cf6", rgb: "139,92,246" },
];

function hostOf(u?: string | null) {
  if (!u) return "";
  try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; }
}

function Ic({ img, host, letter, rgb }: { img?: string | null; host: string; letter: string; rgb: string }) {
  const [err, setErr] = useState(false);
  if (img) return <span className="th-ic" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />;
  if (host && !err) return <span className="th-ic" style={{ background: `rgba(${rgb},.12)` }}><img src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" onError={() => setErr(true)} /></span>;
  return <span className="th-ic"><span className="th-ltr">{letter}</span></span>;
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
        subtitle="Todas las plataformas y recursos de la academia, organizados por categoría. Toca una para abrirla."
        stats={[{ b: items.length, s: "herramientas" }, { b: onlyGeneral ? 1 : groups.length, s: "categorías" }]}
      />

      {items.length === 0 && <span className="muted">Pronto verás herramientas aquí.</span>}

      {groups.map(([cat, tools], gi) => {
        const c = CATS[gi % CATS.length];
        return (
          <section className="th-sec" key={cat} style={{ ["--acc" as string]: c.acc }}>
            {!onlyGeneral && (
              <div className="th-head">
                <span className="th-dot" />
                <h2 className="th-title">{cat}</h2>
                <span className="th-count">{tools.length}</span>
                <span className="th-line" />
              </div>
            )}
            <div className="th-grid">
              {tools.map((t) => {
                const host = hostOf(t.link_url);
                const inner = (
                  <>
                    <Ic img={t.image_url} host={host} letter={t.title.charAt(0).toUpperCase()} rgb={c.rgb} />
                    <span className="th-name">{t.title}</span>
                    {t.link_url && <ArrowUpRight size={18} className="th-arr" />}
                  </>
                );
                return t.link_url ? (
                  <a key={t.id} className="th-row" style={{ ["--acc" as string]: c.acc }} href={t.link_url} target="_blank" rel="noreferrer">{inner}</a>
                ) : (
                  <div key={t.id} className="th-row th-row-nolink" style={{ ["--acc" as string]: c.acc }}>{inner}</div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
