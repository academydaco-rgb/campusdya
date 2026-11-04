import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import CometCursor from "@/components/CometCursor";
import RouteProgress from "@/components/RouteProgress";

export const metadata: Metadata = {
  title: "Campus D&A — Academia",
  description: "La plataforma de estudio de D&A Academy: diplomados, clases y comunidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body><RouteProgress /><CometCursor /><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
