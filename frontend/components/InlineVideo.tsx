"use client";
import { useRef, useState } from "react";
import { Maximize2 } from "lucide-react";

/**
 * Reproduce el video dentro de la propia tarjeta (al tamaño de la tarjeta).
 * Botón de ampliar: pasa el video a pantalla completa (16:9 centrado).
 */
export default function InlineVideo({ url, cover, fallbackBg }: { url?: string | null; cover?: string | null; fallbackBg?: string }) {
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const src = playing && url ? (url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`) : null;

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
        background: cover ? `center/cover url(${cover})` : (fallbackBg || "linear-gradient(135deg,#132038,#0b1020)") }}>
      {src ? (
        <>
          <iframe src={src} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
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
