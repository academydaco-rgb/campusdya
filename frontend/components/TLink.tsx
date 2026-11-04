"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode, CSSProperties } from "react";

export default function TLink({ href, children, className, style }: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const router = useRouter();
  function onClick(e: React.MouseEvent) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      doc.startViewTransition(() => { router.push(href); });
    }
  }
  return <Link href={href} onClick={onClick} className={className} style={style}>{children}</Link>;
}
