"use client";
import { useEffect, useState } from "react";
import { api, ProviderT } from "@/lib/api";

export default function Proveedores() {
  const [items, setItems] = useState<ProviderT[]>([]);
  const [active, setActive] = useState<ProviderT | null>(null);
  useEffect(() => { api.get<ProviderT[]>("/api/providers").then(setItems).catch(() => setItems([])); }, []);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Proveedores ▦</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Conoce a los proveedores recomendados para tu e-commerce.</p>

      {active && (
        <div className="card" style={{ overflow: "hidden", marginBottom: 22 }}>
          {active.videopress_url ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe src={active.videopress_url} allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
          ) : <div style={{ padding: 30 }} className="muted">Sin video.</div>}
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 17 }}>{active.title}</div>
              {active.description && <div className="muted" style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{active.description}</div>}
            </div>
            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setActive(null)}>Cerrar</button>
          </div>
        </div>
      )}

      <div className="grid-3">
        {items.map((c) => (
          <button key={c.id} className="card card-hover" style={{ padding: 0, overflow: "hidden", textAlign: "left", display: "flex", flexDirection: "column", color: "var(--text)" }} onClick={() => setActive(c)}>
            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%",
              background: c.cover_url ? `center/cover url(${c.cover_url})` : "linear-gradient(135deg,#0a2436,#0b1020)" }}>
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 30, color: "rgba(255,255,255,.85)" }}>▶</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", lineHeight: 1.25 }}>{c.title}</div>
              {c.description && <div className="muted" style={{ fontSize: 12.5, marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.description}</div>}
            </div>
          </button>
        ))}
        {items.length === 0 && <span className="muted">Aún no hay proveedores.</span>}
      </div>
    </div>
  );
}
