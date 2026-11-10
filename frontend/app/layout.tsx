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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || ""} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" />
      </head>
      <body><RouteProgress /><CometCursor /><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
