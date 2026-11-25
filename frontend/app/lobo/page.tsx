"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Send, ImagePlus, X, Sparkles, GraduationCap, LineChart, Menu, ArrowLeft } from "lucide-react";

/* ───────── Temario oficial (barra lateral) ───────── */
const TEMARIO: { t: string; items: string[] }[] = [
  { t: "Módulo 1 · Arranca en Meta Ads", items: [
    "1.1 Qué vas a lograr y cómo estudiar el diplomado", "1.2 Tu asistente de IA para Meta Ads",
    "1.3 Los 4 pilares que deciden si vendes", "1.4 Glosario: términos clave de la pauta",
    "1.5 El pentágono digital", "1.6 ¿Por qué pautar en Facebook e Instagram?" ] },
  { t: "Módulo 2 · Valida tu producto y números", items: [
    "2.1 Cómo convertir un producto en ganador", "2.2 Oferta irresistible y ángulo de venta",
    "2.3 Qué es un funnel de ventas y qué medir", "2.4 Costear tu producto · ROI y ROAS", "2.5 Cuánto cobrar y el precio en el anuncio" ] },
  { t: "Módulo 3 · Crea y protege tus activos", items: [
    "3.1 Perfiles, páginas y accesos", "3.2 Fan page e Instagram empresarial", "3.3 El portafolio comercial (BM)",
    "3.4 Dar acceso a personas y socios", "3.5 Conecta redes y crea la cuenta publicitaria",
    "3.6 Facturación y pagos", "3.7 Verifica tu negocio", "3.8 Plan de contingencia", "3.9 ¿Te bloquearon un activo?" ] },
  { t: "Módulo 4 · Domina el administrador", items: [
    "4.1 Recorrido por el administrador y objetivos", "4.2 Públicos fríos, tibios y calientes",
    "4.3 Espiar a tu competencia", "4.4 Estructura de un anuncio que vende", "4.5 Políticas de Meta", "4.6 ¿Landing o WhatsApp?" ] },
  { t: "Ruta A · Landing (M5A–8A)", items: [
    "5A Configura tu sitio web para medir (píxel, API, dominio)", "6A Crea tus campañas a sitio web",
    "7A Optimiza tu campaña web", "8A Escala tus ventas web (métodos 1–6, Cost/Bid Cap)" ] },
  { t: "Ruta B · WhatsApp (M5B–8B)", items: [
    "5B Configura tu WhatsApp para vender", "6B Crea tus campañas a WhatsApp",
    "7B Optimiza y cierra ventas por WhatsApp", "8B Escala tus ventas por WhatsApp" ] },
  { t: "Cierre común (M9–12)", items: [
    "9 Confirma pedidos y fideliza", "10 Remarketing y estrategias avanzadas",
    "11 Estrategias por nicho (moda, calzado, bienestar…)", "12 Ads para servicios" ] },
];

const WELCOME =
`Hola emprendedor 👋🐺
Soy **LOBO ADS**, tu asistente experto en Meta Ads (Facebook e Instagram).

Estoy aquí para ayudarte a **aprender, optimizar y escalar** campañas con datos reales, como en el diplomado de e-commerce.

¿Qué quieres hacer hoy?

**1️⃣ Aprender una lección** del Diplomado de Meta Ads
**2️⃣ Diagnóstico de campañas** por métricas (súbeme una captura)

Responde con 1 o 2 para empezar. 🚀`;

type Msg = { role: "user" | "model"; text: string; img?: string };

/* ───────── Mini-render de markdown ───────── */
function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}
function mdToHtml(src: string) {
  const lines = esc(src).split("\n");
  let html = "", inList = false, lt = "ul";
  const close = () => { if (inList) { html += `</${lt}>`; inList = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { close(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,6})\s+(.*)/))) { close(); const l = Math.min(m[1].length + 1, 4); html += `<h${l}>${inline(m[2])}</h${l}>`; continue; }
    if ((m = line.match(/^[-*•]\s+(.*)/))) { if (!inList || lt !== "ul") { close(); html += "<ul>"; inList = true; lt = "ul"; } html += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = line.match(/^\d+[.)]\s+(.*)/))) { if (!inList || lt !== "ol") { close(); html += "<ol>"; inList = true; lt = "ol"; } html += `<li>${inline(m[1])}</li>`; continue; }
    close(); html += `<p>${inline(line)}</p>`;
  }
  close();
  return html;
}

/* ───────── Reducir imagen antes de enviar ───────── */
function fileToResizedB64(file: File): Promise<{ data: string; mime: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        let { width: w, height: h } = img;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        const url = c.toDataURL("image/jpeg", 0.85);
        resolve({ data: url.split(",")[1], mime: "image/jpeg", preview: url });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LoboPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "model", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { api.get<{ remaining: number }>("/api/lobo/status").then((r) => setRemaining(r.remaining)).catch(() => {}); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  function autoGrow() {
    const t = taRef.current; if (!t) return;
    t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px";
  }

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { setPending(await fileToResizedB64(f)); } catch { /* ignore */ }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if ((!text && !pending) || busy) return;
    const userMsg: Msg = { role: "user", text, img: pending?.preview };
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    setMsgs((p) => [...p, userMsg]);
    setInput(""); const img = pending; setPending(null); setBusy(true);
    if (taRef.current) taRef.current.style.height = "auto";
    try {
      const r = await api.post<{ reply: string; remaining: number }>("/api/lobo/chat", {
        message: text, history, image: img ? { mime: img.mime, data: img.data } : undefined,
      });
      setMsgs((p) => [...p, { role: "model", text: r.reply }]);
      setRemaining(r.remaining);
    } catch (err) {
      setMsgs((p) => [...p, { role: "model", text: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ No pude responder. Intenta de nuevo." }]);
    } finally { setBusy(false); }
  }

  function reset() { setMsgs([{ role: "model", text: WELCOME }]); setPending(null); setInput(""); }

  if (loading || !user) return <div className="lb-boot">Cargando…</div>;

  return (
    <div className="lb-root">
      {/* ── Barra lateral (mismo lenguaje que el sidebar del campus) ── */}
      <aside className={`lb-side${navOpen ? " open" : ""}`}>
        <div className="lb-brand">
          <img src="/lobo-ads.png" alt="LOBO ADS" />
          <div>
            <div className="lb-brand-name">LOBO ADS</div>
            <div className="lb-brand-sub">Asistente de Meta Ads</div>
          </div>
        </div>

        <button className="lb-mode" onClick={() => { send("1"); setNavOpen(false); }}>
          <span className="lb-mode-ic"><GraduationCap size={18} /></span>
          <span><b>Aprender una lección</b><small>Temas del diplomado paso a paso</small></span>
        </button>
        <button className="lb-mode" onClick={() => { send("2"); setNavOpen(false); }}>
          <span className="lb-mode-ic"><LineChart size={18} /></span>
          <span><b>Diagnóstico por métricas</b><small>Sube una captura de tu campaña</small></span>
        </button>

        <div className="lb-temario">
          <div className="lb-temario-h">Temario</div>
          {TEMARIO.map((mod) => (
            <details key={mod.t} className="lb-mod">
              <summary>{mod.t}</summary>
              {mod.items.map((it) => (
                <button key={it} className="lb-les" onClick={() => { send(`Explícame: ${it}`); setNavOpen(false); }}>{it}</button>
              ))}
            </details>
          ))}
        </div>

        <button className="lb-reset" onClick={reset}>Nuevo chat</button>
        <a href="/dashboard" className="lb-back"><ArrowLeft size={14} /> Volver al campus</a>
      </aside>

      {/* ── Chat ── */}
      <main className="lb-main">
        <header className="lb-top">
          <button className="lb-burger" onClick={() => setNavOpen((v) => !v)} aria-label="Menú"><Menu size={20} /></button>
          <div className="lb-top-title"><Sparkles size={15} /> LOBO ADS</div>
          {remaining !== null && <div className="lb-left">{remaining} mensajes hoy</div>}
        </header>

        <div className="lb-scroll" ref={scrollRef}>
          <div className="lb-thread">
            {msgs.map((m, i) => (
              <div key={i} className={`lb-row ${m.role}`}>
                {m.role === "model" && <img className="lb-av" src="/lobo-ads.png" alt="" />}
                <div className={`lb-bubble ${m.role}`}>
                  {m.img && <img className="lb-shot" src={m.img} alt="captura" />}
                  {m.text && <div className="lb-md" dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }} />}
                </div>
              </div>
            ))}
            {busy && (
              <div className="lb-row model">
                <img className="lb-av" src="/lobo-ads.png" alt="" />
                <div className="lb-bubble model"><div className="lb-typing"><span /><span /><span /></div></div>
              </div>
            )}
          </div>
        </div>

        <div className="lb-composer">
          {pending && (
            <div className="lb-preview">
              <img src={pending.preview} alt="adjunto" />
              <button onClick={() => setPending(null)} aria-label="Quitar"><X size={14} /></button>
            </div>
          )}
          <div className="lb-inputbar">
            <button className="lb-attach" onClick={() => fileRef.current?.click()} title="Adjuntar captura"><ImagePlus size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
            <textarea
              ref={taRef} value={input} rows={1} placeholder="Escribe tu pregunta o pega una captura de tu campaña…"
              onChange={(e) => { setInput(e.target.value); autoGrow(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button className="lb-send" disabled={busy || (!input.trim() && !pending)} onClick={() => send()} aria-label="Enviar"><Send size={18} /></button>
          </div>
          <div className="lb-hint">LOBO ADS puede equivocarse. Verifica datos sensibles de tu cuenta. 🐺</div>
        </div>
      </main>

      {navOpen && <div className="lb-ovl" onClick={() => setNavOpen(false)} />}

      <style jsx global>{`
        /* LOBO ADS — reutiliza el sistema visual de campusdya (tokens de globals.css) */
        .lb-boot{min-height:100vh;display:grid;place-items:center;color:var(--muted,#9aa0b8);font-family:var(--font-body,'Montserrat',sans-serif)}
        .lb-root{position:fixed;inset:0;display:grid;grid-template-columns:280px 1fr;background:transparent;
          color:var(--text,#eef0f8);font-family:var(--font-body,'Montserrat',sans-serif);overflow:hidden;z-index:1}

        /* Panel lateral — mismo tratamiento que .sidebar del campus */
        .lb-side{position:relative;z-index:3;display:flex;flex-direction:column;gap:14px;padding:20px 14px;overflow-y:auto;
          margin:14px 0 14px 14px;border:1px solid var(--line,rgba(150,130,255,.14));border-radius:22px;
          background:linear-gradient(180deg,#140f2e 0%,#0c0a1c 48%,#0a0818 100%)}
        .lb-side::before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:
          radial-gradient(60% 22% at 20% 2%, rgba(139,92,246,.26), transparent 70%),
          radial-gradient(70% 18% at 90% 26%, rgba(217,70,239,.16), transparent 70%)}
        .lb-side>*{position:relative;z-index:2}
        .lb-brand{display:flex;align-items:center;gap:12px;padding:2px 4px 2px}
        .lb-brand img{width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(217,70,239,.35))}
        .lb-brand-name{font-size:18px;font-weight:900;letter-spacing:.02em;font-family:var(--font-display,'Montserrat')}
        .lb-brand-sub{font-size:11px;color:var(--muted,#9aa0b8);font-weight:600;margin-top:2px}

        .lb-mode{display:flex;align-items:center;gap:12px;text-align:left;padding:13px 14px;border-radius:var(--r-sm,12px);cursor:pointer;
          color:var(--text);background:var(--card,linear-gradient(160deg,rgba(26,22,48,.92),rgba(12,10,24,.94)));
          border:1px solid var(--line,rgba(150,130,255,.14));transition:border-color .15s,transform .12s,box-shadow .18s}
        .lb-mode:hover{border-color:var(--line-2,rgba(160,140,255,.3));box-shadow:0 0 0 1px rgba(217,70,239,.25),0 0 34px -6px rgba(217,70,239,.3)}
        .lb-mode:active{transform:scale(.98)}
        .lb-mode-ic{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;flex:none;color:#fff;
          background:var(--grad,linear-gradient(100deg,#7c3aed,#c026d3 55%,#db2777));box-shadow:0 8px 18px -8px rgba(192,38,211,.6)}
        .lb-mode b{display:block;font-size:14px;font-weight:700}
        .lb-mode small{display:block;font-size:11.5px;color:var(--muted);margin-top:2px}

        .lb-temario{margin-top:2px;border-top:1px solid var(--line);padding-top:12px;flex:1;min-height:0}
        .lb-temario-h{font-size:10.5px;font-weight:700;letter-spacing:.12em;color:var(--muted-soft,#6b7196);text-transform:uppercase;margin:2px 6px 8px}
        .lb-mod{margin-bottom:2px}
        .lb-mod summary{list-style:none;cursor:pointer;padding:9px 12px;border-radius:12px;font-size:13px;font-weight:600;color:#c7cbe0}
        .lb-mod summary::-webkit-details-marker{display:none}
        .lb-mod summary:hover{background:rgba(255,255,255,.045)}
        .lb-les{display:block;width:100%;text-align:left;padding:7px 12px 7px 20px;font-size:12.5px;color:var(--muted);
          background:transparent;border:0;cursor:pointer;border-radius:10px;line-height:1.35}
        .lb-les:hover{color:#fff;background:rgba(217,70,239,.12)}

        .lb-reset{padding:11px;border-radius:var(--r-sm,12px);background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--text);
          font-weight:700;font-size:13px;cursor:pointer;transition:border-color .15s}
        .lb-reset:hover{border-color:var(--line-2)}
        .lb-back{display:flex;align-items:center;justify-content:center;gap:7px;color:var(--muted);font-size:12.5px;font-weight:600;
          text-decoration:none;padding:4px}
        .lb-back:hover{color:#fff}

        /* Main / chat */
        .lb-main{position:relative;z-index:2;display:flex;flex-direction:column;min-width:0;padding:14px 0}
        .lb-top{display:flex;align-items:center;gap:12px;padding:0 clamp(16px,2.4vw,30px) 14px;margin-bottom:4px;border-bottom:1px solid var(--line)}
        .lb-top-title{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px;color:#fff;font-family:var(--font-display)}
        .lb-top-title svg{color:var(--cyan,#00ffff)}
        .lb-left{margin-left:auto;font-size:12px;color:var(--muted);font-weight:600;padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:rgba(18,16,34,.6)}
        .lb-burger{display:none;background:transparent;border:0;color:var(--text);cursor:pointer}

        .lb-scroll{flex:1;overflow-y:auto;padding:22px 0}
        .lb-thread{max-width:820px;margin:0 auto;padding:0 clamp(16px,2.4vw,30px);display:flex;flex-direction:column;gap:18px}
        .lb-row{display:flex;gap:12px;align-items:flex-start}
        .lb-row.user{flex-direction:row-reverse}
        .lb-av{width:36px;height:36px;border-radius:11px;object-fit:contain;flex:none;padding:3px;
          background:rgba(217,70,239,.08);border:1px solid var(--line)}
        .lb-bubble{max-width:78%;padding:15px 18px;border-radius:var(--r,18px);font-size:14.5px;line-height:1.62;
          box-shadow:var(--shadow,inset 0 1px 0 rgba(255,255,255,.05),0 2px 5px rgba(0,0,0,.35),0 26px 64px -30px rgba(0,0,0,.95))}
        .lb-bubble.model{background:var(--card,linear-gradient(160deg,rgba(26,22,48,.92),rgba(12,10,24,.94)));
          border:1px solid var(--line);border-top-left-radius:6px}
        .lb-bubble.user{background:var(--grad-soft,linear-gradient(120deg,rgba(124,58,237,.28),rgba(217,70,239,.16)));
          border:1px solid var(--line-2,rgba(160,140,255,.3));border-top-right-radius:6px}
        .lb-shot{max-width:260px;width:100%;border-radius:12px;margin-bottom:9px;display:block;border:1px solid var(--line)}

        .lb-md p{margin:0 0 9px}.lb-md p:last-child{margin-bottom:0}
        .lb-md h2,.lb-md h3,.lb-md h4{margin:12px 0 7px;font-weight:800;color:#fff;line-height:1.25;font-family:var(--font-display)}
        .lb-md h2{font-size:17px}.lb-md h3{font-size:15.5px}.lb-md h4{font-size:14.5px}
        .lb-md ul,.lb-md ol{margin:6px 0 10px;padding-left:20px}.lb-md li{margin:3px 0}
        .lb-md strong{color:#fff;font-weight:800}
        .lb-md code{background:rgba(217,70,239,.14);padding:1px 6px;border-radius:6px;font-size:13px;color:#f0abff}

        .lb-typing{display:flex;gap:5px;padding:3px 2px}
        .lb-typing span{width:7px;height:7px;border-radius:50%;background:var(--magenta,#d946ef);opacity:.5;animation:lbbounce 1.2s infinite}
        .lb-typing span:nth-child(2){animation-delay:.2s}.lb-typing span:nth-child(3){animation-delay:.4s}
        @keyframes lbbounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}

        /* Composer */
        .lb-composer{padding:12px clamp(16px,2.4vw,30px) 16px;max-width:820px;margin:0 auto;width:100%}
        .lb-preview{position:relative;width:74px;margin-bottom:10px}
        .lb-preview img{width:74px;height:74px;object-fit:cover;border-radius:12px;border:1px solid var(--line-2)}
        .lb-preview button{position:absolute;top:-7px;right:-7px;width:22px;height:22px;border-radius:50%;cursor:pointer;
          background:#1a1630;color:#fff;display:grid;place-items:center;border:1px solid var(--line-2)}
        .lb-inputbar{display:flex;align-items:flex-end;gap:8px;border-radius:16px;padding:8px 8px 8px 12px;
          background:rgba(18,16,34,.82);border:1px solid var(--line-2,rgba(160,140,255,.3))}
        .lb-inputbar:focus-within{border-color:rgba(217,70,239,.5);box-shadow:0 0 0 3px rgba(217,70,239,.1)}
        .lb-attach{background:transparent;border:0;color:var(--muted);cursor:pointer;padding:7px;display:grid;place-items:center}
        .lb-attach:hover{color:var(--magenta,#d946ef)}
        .lb-inputbar textarea{flex:1;resize:none;background:transparent;border:0;outline:none;color:var(--text);font-family:inherit;
          font-size:14.5px;line-height:1.5;padding:7px 0;max-height:160px}
        .lb-inputbar textarea::placeholder{color:#8b90ab}
        .lb-send{width:40px;height:40px;border-radius:12px;border:0;cursor:pointer;flex:none;display:grid;place-items:center;color:#fff;
          background:var(--grad,linear-gradient(100deg,#7c3aed,#c026d3 55%,#db2777));box-shadow:var(--glow,0 10px 30px -8px rgba(192,38,211,.55))}
        .lb-send:hover{filter:brightness(1.08)}
        .lb-send:disabled{opacity:.45;cursor:default;box-shadow:none}
        .lb-hint{text-align:center;font-size:11px;color:var(--muted-soft,#6b7196);margin-top:9px}

        .lb-ovl{display:none}
        @media(max-width:860px){
          .lb-root{grid-template-columns:1fr}
          .lb-side{position:fixed;top:0;bottom:0;left:0;width:286px;margin:0;border-radius:0;transform:translateX(-100%);transition:transform .25s;z-index:30}
          .lb-side.open{transform:translateX(0)}
          .lb-burger{display:grid;place-items:center}
          .lb-ovl{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:20}
          .lb-bubble{max-width:86%}
        }
      `}</style>
    </div>
  );
}
