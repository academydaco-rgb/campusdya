"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [w, setW] = useState(0);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    setShow(true); setW(14);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setW((x) => (x < 88 ? x + (92 - x) * 0.09 : x)), 180);
  }
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href");
      if (a && href && href.startsWith("/") && !a.target && !e.metaKey && !e.ctrlKey) start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    setW(100);
    const t = setTimeout(() => { setShow(false); setW(0); }, 360);
    return () => clearTimeout(t);
  }, [pathname]);

  return <div className="rprog" style={{ width: show ? `${w}%` : "0", opacity: show ? 1 : 0 }} aria-hidden />;
}
