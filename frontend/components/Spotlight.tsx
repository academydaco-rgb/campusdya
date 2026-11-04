"use client";
import { useEffect } from "react";

export default function Spotlight() {
  useEffect(() => {
    if (window.matchMedia("(hover:none)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const card = (e.target as HTMLElement)?.closest?.(".card") as HTMLElement | null;
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - r.left}px`);
        card.style.setProperty("--sy", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
