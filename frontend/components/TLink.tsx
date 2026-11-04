"use client";
import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";

// Navegacion normal de Next (SPA). La animacion de entrada la maneja
// el template global (framer-motion), de forma uniforme en toda la app.
export default function TLink({ href, children, className, style }: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <Link href={href} className={className} style={style}>{children}</Link>;
}
