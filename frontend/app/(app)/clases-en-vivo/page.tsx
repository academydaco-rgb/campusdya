"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import InlineVideo from "@/components/InlineVideo";
import { api, LiveClassT } from "@/lib/api";
import SectionHero from "@/components/SectionHero";
import { Video } from "lucide-react";

export default function ClasesEnVivo() {
  const [items, setItems] = useState<LiveClassT[]>([]);
  useEffect(() => {
    api.get<LiveClassT[]>("/api/live-classes").then((rows) => {
      // más reciente primero (por fecha; sin fecha, al final)
      const sorted = [...rows].sort((a, b) => {
        const ta = a.happened_at ? new Date(a.happened_at).getTime() : -Infinity;
        const tb = b.happened_at ? new Date(b.happened_at).getTime() : -Infinity;
        return tb - ta;
      });
      setItems(sorted);
    }).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <SectionHero
        icon={<Video size={14} />}
        badge="Biblioteca de clases"
        title="Clases en vivo"
        subtitle="Grabaciones de todas las clases, por si te perdiste alguna. Disponibles cuando quieras."
        stats={[{ b: items.length, s: "grabaciones" }]}
      />

      <div className="grid-4">
        {items.map((c) => (
          <Tilt key={c.id} style={{ height: "100%" }}>
            <div className="card card-hover" style={{ width: "100%", height: "100%", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <InlineVideo url={c.videopress_url} cover={c.cover_url} fallbackBg="linear-gradient(135deg,#132038,#0b1020)" />
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", lineHeight: 1.25 }}>{c.title}</div>
                {c.happened_at && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(c.happened_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</div>}
              </div>
            </div>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay grabaciones.</span>}
      </div>
    </div>
  );
}
