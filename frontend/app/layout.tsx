import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Campus D&A — Academia",
  description: "La plataforma de estudio de D&A Academy: diplomados, clases y comunidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
