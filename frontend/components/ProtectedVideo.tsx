"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Reproductor protegido: normaliza el enlace de VideoPress, bloquea el clic derecho
 * y pone una marca de agua móvil con el correo del estudiante (disuade grabaciones y filtraciones).
 */
export function toEmbed(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  const m = u.match(/videopress\.com\/(?:v|embed)\/([A-Za-z0-9]+)/);
  if (m) return `https://videopress.com/embed/${m[1]}?hd=1&cover=1&playsinline=1&preloadContent=metadata`;
  return u.startsWith("https://") ? u : null;
}

const SPOTS = [{ top: "8%", left: "6%" }, { top: "70%", left: "58%" }, { top: "40%", left: "30%" }, { top: "14%", left: "62%" }, { top: "78%", left: "8%" }];

export default function ProtectedVideo({ url, title }: { url?: string | null; title?: string }) {
  const { user } = useAuth();
  const [spot, setSpot] = useState(0);
  const src = toEmbed(url);

  useEffect(() => {
    const t = setInterval(() => setSpot((s) => (s + 1) % SPOTS.length), 9000);
    return () => clearInterval(t);
  }, []);

  if (!src) return null;
  const mark = user ? `${user.email}` : "Academy D&A";

  return (
    <div className="pv" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <iframe src={src} title={title || "Video"} allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
      <span className="pv-mark" style={SPOTS[spot]} aria-hidden>{mark}</span>
    </div>
  );
}
