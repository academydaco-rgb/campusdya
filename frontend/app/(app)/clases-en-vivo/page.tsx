"use client";
import { useEffect, useState } from "react";
import Tilt from "@/components/Tilt";
import { api, LiveClassT } from "@/lib/api";

export default function ClasesEnVivo() {
  const [items, setItems] = useState<LiveClassT[]>([]);
  const [active, setActive] = useState<LiveClassT | null>(null);
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
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Clases en vivo 🎥</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Grabaciones de las clases, por si te perdiste alguna.</p>

      {active && (
        <div className="card" style={{ overflow: "hidden", marginBottom: 22 }}>
          {active.videopress_url ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe src={active.videopress_url} allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
          ) : <div style={{ padding: 30 }} className="muted">Sin video.</div>}
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontWeight: 700 }}>{active.title}</div>
            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setActive(null)}>Cerrar</button>
          </div>
        </div>
      )}

      <div className="grid-4">
        {items.map((c) => (
          <Tilt key={c.id} style={{ height: "100%" }}>
          <button className="card card-hover" style={{ width: "100%", height: "100%", padding: 0, overflow: "hidden", textAlign: "left", display: "flex", flexDirection: "column", color: "var(--text)" }} onClick={() => setActive(c)}>
            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%",
              background: c.cover_url ? `center/cover url(${c.cover_url})` : "linear-gradient(135deg,#132038,#0b1020)" }}>
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span className="play-badge">▶</span></span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", lineHeight: 1.25 }}>{c.title}</div>
              {c.happened_at && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(c.happened_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</div>}
            </div>
          </button>
          </Tilt>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay grabaciones.</span>}
      </div>
    </div>
  );
}
