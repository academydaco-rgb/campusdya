"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import InlineVideo from "@/components/InlineVideo";
import { api, CasoExitoT } from "@/lib/api";
import { Trophy } from "lucide-react";

export default function CasosExito() {
  const [items, setItems] = useState<CasoExitoT[]>([]);
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

      {/* Grid de campeones: solo video + portada */}
      <div className="grid-4" style={{ marginTop: 22 }}>
        {items.map((c) => (
          <Tilt key={c.id} style={{ height: "100%" }}>
            <div className="ce-card" style={{ overflow: "hidden" }}>
              <InlineVideo url={c.videopress_url} cover={c.cover_url} fallbackBg="linear-gradient(135deg,#2a1840,#120b22)" />
            </div>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Pronto publicaremos los primeros casos de éxito. 🏆</span>}
      </div>
    </div>
  );
}
