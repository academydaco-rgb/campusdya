"use client";
import { useEffect, useRef } from "react";

export default function CometCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover:none)").matches) return;
    const tail = el.querySelector(".comet-tail") as HTMLElement | null;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let x = tx, y = ty, px = x, py = y, raf = 0, idle = 999;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; idle = 0; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const loop = () => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      const vx = x - px, vy = y - py;
      const speed = Math.hypot(vx, vy);
      const ang = Math.atan2(vy, vx) * 180 / Math.PI;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.opacity = idle < 50 ? String(Math.min(0.95, 0.2 + speed / 16)) : "0";
      if (tail) { tail.style.width = Math.min(speed * 2.4, 95) + "px"; tail.style.transform = `rotate(${ang + 180}deg)`; }
      px = x; py = y; idle++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} className="comet" aria-hidden>
      <span className="comet-tail" />
      <span className="comet-head" />
    </div>
  );
}
