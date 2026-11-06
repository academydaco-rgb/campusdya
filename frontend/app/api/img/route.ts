import { NextRequest } from "next/server";

// Proxy de imagen del mismo origen para poder dibujar la insignia en el canvas
// del certificado sin que CORS "manche" (taint) el canvas.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("missing u", { status: 400 });
  let target: URL;
  try { target = new URL(u); } catch { return new Response("bad url", { status: 400 }); }
  if (target.protocol !== "https:" && target.protocol !== "http:") return new Response("bad scheme", { status: 400 });
  // Limitar al host del backend configurado
  try {
    const apiHost = new URL(process.env.NEXT_PUBLIC_API_URL || "").host;
    if (apiHost && target.host !== apiHost) return new Response("host not allowed", { status: 403 });
  } catch { /* si no hay API_URL, permitir */ }
  try {
    const r = await fetch(target.toString());
    if (!r.ok) return new Response("fetch failed", { status: 502 });
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch { return new Response("error", { status: 502 }); }
}
