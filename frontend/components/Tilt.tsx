"use client";
import { useRef } from "react";

export default function Tilt({ children, max = 6, className, style }: { children: React.ReactNode; max?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const noHover = typeof window !== "undefined" && window.matchMedia("(hover:none)").matches;

  function move(e: React.PointerEvent) {
    if (noHover) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }
  function leave() { if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0)"; }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={className}
      style={{ transition: "transform .2s ease", transformStyle: "preserve-3d", ...style }}>
      {children}
    </div>
  );
}
