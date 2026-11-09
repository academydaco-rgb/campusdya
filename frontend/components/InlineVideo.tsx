"use client";
import { useRef, useState } from "react";
import { Maximize2 } from "lucide-react";

/** Extrae el ID de un enlace de YouTube en cualquiera de sus formas. */
function ytId(u: string): string | null {
  const m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
/** Convierte la URL al embed reproducible (YouTube o VideoPress/otros) con autoplay. */
function toEmbed(url: string): string {
  const id = ytId(url);
  if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`;
}

/**
 * Reproduce el video dentro de la propia tarjeta (al tamaño de la tarjeta).
 * Soporta YouTube y VideoPress. Botón de ampliar: pantalla completa 16:9.
 */
export default function InlineVideo({ url, cover, fallbackBg }: { url?: string | null; cover?: string | null; fallbackBg?: string }) {
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const src = playing && url ? toEmbed(url) : null;

  // Portada: la subida, o la miniatura de YouTube si el enlace es de YT.
  const ytid = url ? ytId(url) : null;
  const poster = cover || (ytid ? `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` : null);

  function expand(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    if (document.fullscreenElement || d.webkitFullscreenElement) {
      (document.exitFullscreen || d.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  }
  function play(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (url) setPlaying(true);
  }

  return (
    <div ref={wrapRef} className="live-frame"
      style={{ position: "relative", width: "100%", paddingTop: "56.25%", overflow: "hidden",
        background: poster ? `center/cover url(${poster})` : (fallbackBg || "linear-gradient(135deg,#132038,#0b1020)") }}>
      {src ? (
        <>
          <iframe src={src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          <button type="button" className="live-expand" onClick={expand} aria-label="Ampliar a pantalla completa" title="Pantalla completa">
            <Maximize2 size={15} />
          </button>
        </>
      ) : url ? (
        <button type="button" onClick={play} aria-label="Reproducir"
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", border: 0, background: "transparent", cursor: "pointer", padding: 0 }}>
          <span className="play-badge">▶</span>
        </button>
      ) : (
        <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,.4)", fontSize: 13 }}>Sin video</span>
      )}
    </div>
  );
}
