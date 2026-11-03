"use client";
import { useEffect, useState } from "react";
import { api, LiveClassT } from "@/lib/api";

export default function ClasesEnVivo() {
  const [items, setItems] = useState<LiveClassT[]>([]);
  const [active, setActive] = useState<LiveClassT | null>(null);
  useEffect(() => { api.get<LiveClassT[]>("/api/live-classes").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Clases en vivo 🎥</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Grabaciones de las clases, por si te perdiste alguna.</p>

      {active && (
        <div className="card" style={{ overflow: "hidden", marginBottom: 20 }}>
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

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {items.map((c) => (
          <button key={c.id} className="card" style={{ padding: 0, overflow: "hidden", textAlign: "left" }} onClick={() => setActive(c)}>
            <div style={{ height: 120, background: "linear-gradient(135deg,#1a1033,#0b1020)", display: "grid", placeItems: "center", fontSize: 34 }}>▶</div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700 }}>{c.title}</div>
              {c.happened_at && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{new Date(c.happened_at).toLocaleDateString("es-CO")}</div>}
            </div>
          </button>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay grabaciones.</span>}
      </div>
    </div>
  );
}
