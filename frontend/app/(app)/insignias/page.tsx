"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api, MyBadgeT } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const SITE = "https://campusdya.com";

async function descargarCertificado(b: MyBadgeT, userName: string) {
  const c = document.createElement("canvas");
  c.width = 1600; c.height = 1130;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  // Fondo
  const g = ctx.createLinearGradient(0, 0, 1600, 1130);
  g.addColorStop(0, "#071326"); g.addColorStop(0.55, "#0a1630"); g.addColorStop(1, "#0a0f22");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 1130);
  // Marco
  ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4; ctx.strokeRect(46, 46, 1508, 1038);
  ctx.strokeStyle = "rgba(0,255,255,.25)"; ctx.lineWidth = 1.5; ctx.strokeRect(66, 66, 1468, 998);
  ctx.textAlign = "center";
  // Encabezado
  ctx.fillStyle = "#00ffff"; ctx.font = "bold 40px Arial"; ctx.fillText("D&A ACADEMY", 800, 170);
  ctx.fillStyle = "#9fb4c7"; ctx.font = "600 22px Arial"; ctx.fillText("CERTIFICADO DE FINALIZACIÓN", 800, 215);
  // Emblema
  ctx.beginPath(); ctx.arc(800, 320, 54, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,255,255,.12)"; ctx.fill();
  ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = "54px Arial"; ctx.fillText("🎓", 800, 340);
  // Cuerpo
  ctx.fillStyle = "#8aa0ad"; ctx.font = "24px Arial"; ctx.fillText("Se otorga el presente certificado a", 800, 460);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 64px Georgia"; ctx.fillText(userName, 800, 540);
  ctx.strokeStyle = "rgba(0,255,255,.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(500, 568); ctx.lineTo(1100, 568); ctx.stroke();
  ctx.fillStyle = "#8aa0ad"; ctx.font = "24px Arial"; ctx.fillText("por completar satisfactoriamente el diplomado", 800, 630);
  ctx.fillStyle = "#eafcff"; ctx.font = "bold 40px Arial";
  const title = b.diploma_title || b.name;
  ctx.fillText(title.length > 46 ? title.slice(0, 45) + "…" : title, 800, 695);
  // Fecha
  ctx.fillStyle = "#5b6480"; ctx.font = "22px Arial";
  const fecha = new Date(b.awarded_at || Date.now()).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
  ctx.fillText(`Otorgado el ${fecha}`, 800, 760);
  // Verificación + QR
  const code = b.code || "—";
  const verifyUrl = `${SITE}/verificar/${code}`;
  try {
    const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180, color: { dark: "#06283d", light: "#ffffff" } });
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = qr; });
    ctx.fillStyle = "#ffffff"; ctx.fillRect(130, 905, 150, 150);
    ctx.drawImage(img, 135, 910, 140, 140);
  } catch { /* sin qr */ }
  ctx.textAlign = "left";
  ctx.fillStyle = "#9fb4c7"; ctx.font = "600 20px Arial"; ctx.fillText("Código de verificación", 300, 955);
  ctx.fillStyle = "#00ffff"; ctx.font = "bold 30px monospace"; ctx.fillText(code, 300, 992);
  ctx.fillStyle = "#5b6480"; ctx.font = "18px Arial"; ctx.fillText(`Verifica en campusdya.com/verificar/${code}`, 300, 1025);
  ctx.textAlign = "right";
  ctx.fillStyle = "#5b6480"; ctx.font = "italic 20px Georgia"; ctx.fillText("Dirección académica · D&A Academy", 1460, 1000);

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `certificado-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
  a.click();
}

function compartirFacebook(code?: string | null) {
  const url = code ? `${SITE}/verificar/${code}` : SITE;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=500");
}

export default function Insignias() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyBadgeT[]>([]);
  useEffect(() => { api.get<MyBadgeT[]>("/api/me/badges").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Mis insignias y certificados 🏅</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Completa diplomados y gánate tu certificado verificable. Descárgalo y compártelo.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {items.map((b) => (
          <div key={b.id} className="card" style={{ padding: 22, textAlign: "center" }}>
            {b.image_url
              ? <img src={b.image_url} alt={b.name} style={{ width: 84, height: 84, objectFit: "contain", margin: "0 auto", display: "block", filter: "drop-shadow(0 0 16px rgba(0,255,255,.45))" }} />
              : <div style={{ fontSize: 60, filter: "drop-shadow(0 0 18px var(--cyan))" }}>{b.icon || "🏅"}</div>}
            <div style={{ fontWeight: 800, marginTop: 10, color: "#fff" }}>{b.diploma_title || b.name}</div>
            {b.code && <div className="muted" style={{ fontSize: 11.5, marginTop: 4, fontFamily: "monospace" }}>Código: {b.code}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
              <button className="btn btn-primary" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => descargarCertificado(b, user?.name || "Alumno")}>Descargar certificado</button>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => compartirFacebook(b.code)}>Compartir</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card" style={{ padding: 24 }}><span className="muted">Aún no tienes certificados. ¡Completa tu primer diplomado!</span></div>}
      </div>
    </div>
  );
}
