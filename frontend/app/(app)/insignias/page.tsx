"use client";
import { useEffect, useState } from "react";
import { api, MyBadgeT } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function descargarInsignia(b: MyBadgeT, userName: string) {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 800;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#05060a"; ctx.fillRect(0, 0, 1200, 800);
  const g = ctx.createLinearGradient(0, 0, 1200, 800);
  g.addColorStop(0, "#1a1033"); g.addColorStop(1, "#06121a");
  ctx.fillStyle = g; ctx.fillRect(40, 40, 1120, 720);
  ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 6; ctx.strokeRect(40, 40, 1120, 720);
  ctx.textAlign = "center";
  ctx.fillStyle = "#22d3ee"; ctx.font = "bold 34px Arial"; ctx.fillText("ACADEMIA D&A", 600, 150);
  ctx.fillStyle = "#8a93ab"; ctx.font = "24px Arial"; ctx.fillText("CERTIFICADO DE LOGRO", 600, 200);
  ctx.font = "120px Arial"; ctx.fillText(b.icon || "🏅", 600, 360);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 46px Arial"; ctx.fillText(b.name, 600, 470);
  ctx.fillStyle = "#8a93ab"; ctx.font = "26px Arial"; ctx.fillText("Otorgado a", 600, 540);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 40px Arial"; ctx.fillText(userName, 600, 595);
  ctx.fillStyle = "#5b6480"; ctx.font = "22px Arial";
  ctx.fillText(new Date(b.awarded_at || Date.now()).toLocaleDateString("es-CO"), 600, 680);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `insignia-${b.name.replace(/\s+/g, "-").toLowerCase()}.png`;
  a.click();
}

function compartirFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://campusdya.com")}`,
    "_blank", "width=600,height=500");
}

export default function Insignias() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyBadgeT[]>([]);
  useEffect(() => { api.get<MyBadgeT[]>("/api/me/badges").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Mis insignias 🏅</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Completa diplomados y gánate tus insignias. Descárgalas y compártelas.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {items.map((b) => (
          <div key={b.id} className="card" style={{ padding: 22, textAlign: "center" }}>
            <div style={{ fontSize: 64, filter: "drop-shadow(0 0 18px var(--cyan))" }}>{b.icon || "🏅"}</div>
            <div style={{ fontWeight: 800, marginTop: 10 }}>{b.name}</div>
            {b.description && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{b.description}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => descargarInsignia(b, user?.name || "Alumno")}>Descargar</button>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={compartirFacebook}>Facebook</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card" style={{ padding: 24 }}><span className="muted">Aún no tienes insignias. ¡Completa tu primer diplomado!</span></div>}
      </div>
    </div>
  );
}
