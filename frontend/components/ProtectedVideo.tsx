"use client";
import { useState } from "react";

/**
 * Reproductor protegido: normaliza el enlace de VideoPress y bloquea
 * el clic derecho / arrastre sobre el video.
 */
export function toEmbed(url?: string | null): string | null {
  if (!url) return null;
  let u = url.trim();
  // Si pegaron el código <iframe ...>, sacamos el src
  const src = u.match(/src\s*=\s*["']([^"']+)["']/i);
  if (src) u = src[1];
  u = u.replace(/&amp;/g, "&");
  // VideoPress: videopress.com/v|embed/ID  o  video.wordpress.com/v|embed/ID
  const vp = u.match(/(?:videopress\.com|video\.wordpress\.com)\/(?:v|embed)\/([A-Za-z0-9]+)/i);
  if (vp) return `https://videopress.com/embed/${vp[1]}?hd=1&cover=1&playsinline=1&preloadContent=metadata`;
  // YouTube por si acaso
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  if (/^\/\//.test(u)) u = "https:" + u;
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:/i, "https:");
  if (!/^https:\/\//i.test(u) && /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(u)) u = "https://" + u;
  return /^https:\/\//i.test(u) ? u : null;
}

export default function ProtectedVideo({ url, title, poster }: { url?: string | null; title?: string; poster?: string | null }) {
  const [playing, setPlaying] = useState(!poster);
  const src = toEmbed(url);

  if (!src) return null;

  if (!playing && poster) {
    return (
      <button type="button" className="pv pv-poster" onClick={() => setPlaying(true)} aria-label={`Reproducir ${title || "video"}`}
        style={{ backgroundImage: `url(${poster})` }} onContextMenu={(e) => e.preventDefault()}>
        <span className="pv-play"><svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg></span>
      </button>
    );
  }

  const auto = src.includes("youtube") ? "autoplay=1" : "autoPlay=1";
  const playSrc = poster ? `${src}${src.includes("?") ? "&" : "?"}${auto}` : src;
  return (
    <div className="pv" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <iframe src={playSrc} title={title || "Video"} allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  );
}
