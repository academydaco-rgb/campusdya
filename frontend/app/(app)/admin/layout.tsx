"use client";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user && user.role === "alumno") {
    return <div className="card" style={{ padding: 24 }}>No tienes acceso al área de administración.</div>;
  }
  return <>{children}</>;
}
