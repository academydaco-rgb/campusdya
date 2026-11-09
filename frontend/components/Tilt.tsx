"use client";
import { useRef } from "react";

export default function Tilt({ children, max = 6, className, style }: { children: React.ReactNode; max?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const down = useRef(false);
  const noHover = typeof window !== "undefined" && window.matchMedia("(hover:none)").matches;

  function tilt(e: React.PointerEvent) {
    if (noHover || down.current) return;
    const el = ref.current; if (!el) return;
    el.style.transition = "transform .2s ease";
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }
  function flat(instant = false) {
    const el = ref.current; if (!el) return;
    el.style.transition = instant ? "none" : "transform .2s ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  }
  // Al presionar aplanamos al instante y dejamos la tarjeta quieta: asi el clic
  // cae en el mismo elemento en mousedown y mouseup y entra al primer intento.
  // (El tilt 3D desviaba el hit-test y el navegador cancelaba el click, por eso
  //  tocaba darle varias veces para ingresar al diplomado.)
  function onDown() { down.current = true; flat(true); }
  function onUp() { down.current = false; }
  function onLeave() { down.current = false; flat(); }

  return (
    <div ref={ref} onPointerMove={tilt} onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={onLeave}
      className={className}
      style={{ transition: "transform .2s ease", transformStyle: "preserve-3d", ...style }}>
      {children}
    </div>
  );
}
