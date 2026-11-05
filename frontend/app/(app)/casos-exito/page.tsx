"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import { api, CasoExitoT } from "@/lib/api";
import { Trophy, Play, Flame, ExternalLink, X } from "lucide-react";

export default function CasosExito() {
  const [items, setItems] = useState<CasoExitoT[]>([]);
  const [active, setActive] = useState<CasoExitoT | null>(null);

  useEffect(() => {
    api.get<CasoExitoT[]>("/api/success-cases").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      {/* Hero ganador */}
      <section className="ce-hero fade-up">
        <div className="ce-hero-glow" />
        <div className="ce-hero-stars" />
        <div className="ce-hero-in">
          <span className="ce-badge"><Trophy size={14} /> Salón de la fama</span>
          <h1 className="ce-title">Casos de éxito</h1>
          <p className="ce-sub">Los estudiantes que la están rompiendo. Resultados reales, historias reales… y el próximo puedes ser tú.</p>
          <div className="ce-stats">
            <div className="ce-stat"><b>70%</b><span>casos de éxito</span></div>
            <div className="ce-stat"><b>+1.700</b><span>estudiantes</span></div>
            <div className="ce-stat"><b>9</b><span>países</span></div>
          </div>
        </div>
      </section>

      {/* Reproductor */}
      {active && (
        <div className="card ce-player" style={{ overflow: "hidden", margin: "22px 0" }}>
          {active.videopress_url ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe src={active.videopress_url} allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
          ) : <div style={{ padding: 30 }} className="muted">Sin video.</div>}
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="ce-ribbon-sm"><Trophy size={13} /> Ganador</span>
            <div style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{active.title}</div>
            {active.external_url && (
              <a className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} href={active.external_url} target="_blank" rel="noreferrer">Ver más <ExternalLink size={13} /></a>
            )}
            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setActive(null)}><X size={15} /></button>
          </div>
          {active.description && <div style={{ padding: "0 16px 16px", color: "#c9c5e0", fontSize: 14, lineHeight: 1.55 }}>{active.description}</div>}
        </div>
      )}

      {/* Grid de campeones */}
      <div className="grid-3" style={{ marginTop: 22 }}>
        {items.map((c, i) => (
          <Tilt key={c.id} style={{ height: "100%" }}>
            <button className="ce-card" onClick={() => setActive(c)}>
              <span className="ce-ribbon"><Trophy size={12} /> Ganador</span>
              {i === 0 && <span className="ce-fire"><Flame size={13} /> Top</span>}
              <div className="ce-cover" style={{ background: c.cover_url ? `center/cover url(${c.cover_url})` : "linear-gradient(135deg,#2a1840,#120b22)" }}>
                <span className="ce-play"><Play size={20} style={{ marginLeft: 2 }} /></span>
              </div>
              <div className="ce-body">
                <div className="ce-name">{c.title}</div>
                {c.description && <div className="ce-desc">{c.description}</div>}
              </div>
            </button>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Pronto publicaremos los primeros casos de éxito. 🏆</span>}
      </div>
    </div>
  );
}
