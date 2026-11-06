import { NextRequest } from "next/server";

// Proxy de imagen del mismo origen para poder dibujar la insignia en el canvas
// del certificado sin que CORS "manche" (taint) el canvas.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("missing u", { status: 400 });
  let target: URL;
  try { target = new URL(u); } catch { return new Response("bad url", { status: 400 }); }
  if (target.protocol !== "https:") return new Response("bad scheme", { status: 400 });
  // Solo imágenes del backend propio (evita usar este proxy para atacar otros servidores)
  let apiHost = "";
  try { apiHost = new URL(process.env.NEXT_PUBLIC_API_URL || "").host; } catch { apiHost = ""; }
  if (!apiHost || target.host !== apiHost || !target.pathname.startsWith("/static/")) return new Response("host not allowed", { status: 403 });
  try {
    const r = await fetch(target.toString());
    if (!r.ok) return new Response("fetch failed", { status: 502 });
    const ct = r.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return new Response("not an image", { status: 415 });
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": ct,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch { return new Response("error", { status: 502 }); }
}
