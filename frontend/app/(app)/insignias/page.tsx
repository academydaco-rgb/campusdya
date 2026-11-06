"use client";
import { useEffect, useState } from "react";
import { api, MyBadgeT } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Download, BadgeCheck } from "lucide-react";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a) * 1.05;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function loadImg(src: string, cross = false): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    if (cross) im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

async function descargarCertificado(b: MyBadgeT, userName: string) {
  const W = 1600, H = 1130;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  try { await (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready; } catch { /* noop */ }

  // ── Fondo espacio profundo ──
  ctx.fillStyle = "#07060f"; ctx.fillRect(0, 0, W, H);
  const neb = (x: number, y: number, r: number, col: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  };
  neb(120, 90, 720, "rgba(34,224,255,.16)");
  neb(1520, 120, 760, "rgba(217,70,239,.20)");
  neb(1500, 1080, 760, "rgba(139,92,246,.20)");
  neb(120, 1060, 640, "rgba(124,58,237,.14)");
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * W, y = Math.random() * H, s = Math.random() * 1.6 + 0.3;
    ctx.globalAlpha = Math.random() * 0.5 + 0.15;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Marco con degradado ──
  const fg = ctx.createLinearGradient(40, 40, W - 40, H - 40);
  fg.addColorStop(0, "#22e0ff"); fg.addColorStop(0.5, "#d946ef"); fg.addColorStop(1, "#8b5cf6");
  ctx.strokeStyle = fg; ctx.lineWidth = 3; rr(ctx, 44, 44, W - 88, H - 88, 28); ctx.stroke();
  ctx.strokeStyle = "rgba(217,70,239,.3)"; ctx.lineWidth = 1.4; rr(ctx, 64, 64, W - 128, H - 128, 20); ctx.stroke();

  ctx.textAlign = "center";

  // ── Logo ──
  try {
    const logo = await loadImg("/logo.png");
    const lw = 270, lh = lw * (logo.height / logo.width || 0.78);
    ctx.drawImage(logo, W / 2 - lw / 2, 86, lw, lh);
  } catch { /* sin logo */ }

  ctx.fillStyle = "#c9b7ff"; ctx.font = "700 24px Montserrat, Arial";
  ctx.fillText("C E R T I F I C A D O   D E   F I N A L I Z A C I Ó N", W / 2, 360);

  // ── Emblema: insignia del diplomado (o hexágono de respaldo) ──
  const cx = W / 2, cy = 474;
  let drew = false;
  if (b.image_url) {
    try {
      const proxied = `/api/img?u=${encodeURIComponent(b.image_url)}`;
      let bi: HTMLImageElement;
      try { bi = await loadImg(proxied); } catch { bi = await loadImg(b.image_url, true); }
      const bw = 186, bh = bw * (bi.height / bi.width || 1);
      ctx.save(); ctx.shadowColor = "rgba(217,70,239,.6)"; ctx.shadowBlur = 46;
      ctx.drawImage(bi, cx - bw / 2, cy - bh / 2, bw, bh); ctx.restore();
      drew = true;
    } catch { /* fallback */ }
  }
  if (!drew) {
    const R = 58;
    const eg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    eg.addColorStop(0, "#d946ef"); eg.addColorStop(1, "#7c3aed");
    ctx.save(); ctx.shadowColor = "rgba(217,70,239,.6)"; ctx.shadowBlur = 36;
    hexPath(ctx, cx, cy, R); ctx.fillStyle = eg; ctx.fill(); ctx.restore();
    hexPath(ctx, cx, cy, R); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.font = "48px Arial"; ctx.fillText("🎓", cx, cy + 16);
  }

  // ── Cuerpo ──
  ctx.textAlign = "center";
  ctx.fillStyle = "#9aa0b8"; ctx.font = "400 24px Montserrat, Arial";
  ctx.fillText("Se otorga el presente certificado a", cx, 596);
  ctx.fillStyle = "#ffffff"; ctx.font = "800 68px Montserrat, Georgia";
  ctx.fillText(userName, cx, 672);
  const ug = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0);
  ug.addColorStop(0, "rgba(34,224,255,0)"); ug.addColorStop(0.5, "#22e0ff"); ug.addColorStop(1, "rgba(217,70,239,0)");
  ctx.strokeStyle = ug; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 320, 700); ctx.lineTo(cx + 320, 700); ctx.stroke();

  ctx.fillStyle = "#9aa0b8"; ctx.font = "400 24px Montserrat, Arial";
  ctx.fillText("por completar satisfactoriamente el diplomado", cx, 758);
  ctx.fillStyle = "#eafcff"; ctx.font = "800 42px Montserrat, Arial";
  const title = b.diploma_title || b.name;
  ctx.fillText(title.length > 44 ? title.slice(0, 43) + "…" : title, cx, 818);

  ctx.fillStyle = "#6b7196"; ctx.font = "400 22px Montserrat, Arial";
  const fecha = new Date(b.awarded_at || Date.now()).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
  ctx.fillText(`Otorgado el ${fecha}`, cx, 872);

  // ── Firmas de fundadores ──
  const LINE_Y = 968;
  const firma = async (src: string, x: number, name: string) => {
    ctx.textAlign = "center";
    try {
      const im = await loadImg(src);
      const ratio = (im.height / im.width) || 0.4;
      let dw = 320, dh = dw * ratio;        // firma grande y legible
      const MAXH = 130;
      if (dh > MAXH) { dh = MAXH; dw = dh / ratio; }
      ctx.drawImage(im, x - dw / 2, LINE_Y - dh - 4, dw, dh);
    } catch { /* sin firma aún */ }
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 180, LINE_Y); ctx.lineTo(x + 180, LINE_Y); ctx.stroke();
    ctx.fillStyle = "#eafcff"; ctx.font = "700 27px Montserrat, Arial"; ctx.fillText(name, x, LINE_Y + 38);
    ctx.fillStyle = "#9aa0b8"; ctx.font = "400 18px Montserrat, Arial"; ctx.fillText("Fundador · D&A Academy", x, LINE_Y + 66);
  };
  await firma("/firmadiego.png", 520, "Diego Patarroyo");
  await firma("/firmaandres.png", 1080, "Andrés Patarroyo");

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `certificado-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
  a.click();
}

export default function Insignias() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyBadgeT[]>([]);
  useEffect(() => { api.get<MyBadgeT[]>("/api/me/badges").then(setItems).catch(() => setItems([])); }, []);
  return (
    <div>
      <div className="sec-h" style={{ marginBottom: 4 }}>
        <span className="ic"><BadgeCheck /></span>
        <h2 style={{ fontSize: 24 }}>Mis insignias y certificados</h2>
      </div>
      <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Completa diplomados y gánate tu certificado con la insignia del diplomado y la firma de los fundadores.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {items.map((b) => (
          <div key={b.id} className="card" style={{ padding: 24, textAlign: "center" }}>
            {b.image_url
              ? <img src={b.image_url} alt={b.name} style={{ width: 96, height: 96, objectFit: "contain", margin: "0 auto", display: "block", filter: "drop-shadow(0 8px 20px rgba(217,70,239,.5))" }} />
              : <div style={{ fontSize: 60, filter: "drop-shadow(0 0 18px var(--magenta))" }}>{b.icon || "🏅"}</div>}
            <div style={{ fontWeight: 800, marginTop: 12, color: "#fff" }}>{b.diploma_title || b.name}</div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 12px", fontSize: 13.5 }} onClick={() => descargarCertificado(b, user?.name || "Alumno")}><Download size={15} /> Descargar certificado</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card" style={{ padding: 24 }}><span className="muted">Aún no tienes certificados. ¡Completa tu primer diplomado!</span></div>}
      </div>
    </div>
  );
}
