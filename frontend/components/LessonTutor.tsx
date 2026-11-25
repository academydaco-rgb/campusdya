"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Send, ImagePlus, X, Sparkles } from "lucide-react";

/* Panel de chat del Tutor IA embebido en una lección.
   Aparece en TODAS las lecciones; si la clase aún no tiene transcripción cargada,
   el backend responde con el material general del diplomado. */

type Msg = { role: "user" | "model"; text: string; img?: string };

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inline(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/__(.+?)__/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");
}
function mdToHtml(src: string) {
  const lines = esc(src).split("\n"); let html = "", inList = false, lt = "ul";
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
  close(); return html;
}
function fileToResizedB64(file: File): Promise<{ data: string; mime: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280; let { width: w, height: h } = img;
        const scale = Math.min(1, max / Math.max(w, h)); w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h); const url = c.toDataURL("image/jpeg", 0.85);
        resolve({ data: url.split(",")[1], mime: "image/jpeg", preview: url });
      };
      img.onerror = reject; img.src = reader.result as string;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export default function LessonTutor({ lessonId, lessonTitle, diploma }: { lessonId: string; lessonTitle: string; diploma: string }) {
  const welcome = `¡Hola! 🐺 Soy tu tutor de esta clase, **${lessonTitle}**. Pregúntame lo que no te quedó claro del video.`;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "model", text: welcome }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  // reinicia el saludo si el alumno cambia de lección
  useEffect(() => { setMsgs([{ role: "model", text: welcome }]); setPending(null); setInput(""); /* eslint-disable-next-line */ }, [lessonId]);

  function autoGrow() { const t = taRef.current; if (!t) return; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 130) + "px"; }
  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { setPending(await fileToResizedB64(f)); } catch { /* ignore */ }
    if (fileRef.current) fileRef.current.value = "";
  }
  async function send() {
    const text = input.trim();
    if ((!text && !pending) || busy) return;
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    setMsgs((p) => [...p, { role: "user", text, img: pending?.preview }]);
    setInput(""); const img = pending; setPending(null); setBusy(true);
    if (taRef.current) taRef.current.style.height = "auto";
    try {
      const r = await api.post<{ reply: string }>(`/api/lobo/lesson/${lessonId}/chat`, {
        message: text, history, diploma, lesson_title: lessonTitle,
        image: img ? { mime: img.mime, data: img.data } : undefined,
      });
      setMsgs((p) => [...p, { role: "model", text: r.reply }]);
    } catch (err) {
      setMsgs((p) => [...p, { role: "model", text: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ No pude responder. Intenta de nuevo." }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="lt-wrap">
      <div className="lt-head">
        <span className="lt-mk"><Sparkles size={17} /></span>
        <div><b>Tutor de esta clase</b><small>Resuelve tus dudas con IA</small></div>
      </div>
      <div className="lt-msgs" ref={scrollRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`lt-row ${m.role}`}>
            {m.role === "model" && <span className="lt-av"><Sparkles size={14} /></span>}
            <div className={`lt-bub ${m.role}`}>
              {m.img && <img className="lt-shot" src={m.img} alt="captura" />}
              {m.text && <div className="lt-md" dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }} />}
            </div>
          </div>
        ))}
        {busy && <div className="lt-row model"><span className="lt-av"><Sparkles size={14} /></span><div className="lt-bub model"><div className="lt-typing"><span /><span /><span /></div></div></div>}
      </div>
      {pending && (
        <div className="lt-preview"><img src={pending.preview} alt="adjunto" /><button onClick={() => setPending(null)} aria-label="Quitar"><X size={13} /></button></div>
      )}
      <div className="lt-inbar">
        <button className="lt-att" onClick={() => fileRef.current?.click()} title="Adjuntar captura"><ImagePlus size={19} /></button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
        <textarea ref={taRef} value={input} rows={1} placeholder="Pregunta sobre esta clase…"
          onChange={(e) => { setInput(e.target.value); autoGrow(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="lt-snd" disabled={busy || (!input.trim() && !pending)} onClick={send} aria-label="Enviar"><Send size={17} /></button>
      </div>

      <style jsx>{`
        .lt-wrap{display:flex;flex-direction:column;height:100%;min-height:0}
        .lt-head{display:flex;align-items:center;gap:10px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line)}
        .lt-mk{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;flex:none;color:#fff;background:var(--grad);box-shadow:var(--glow)}
        .lt-head b{font-size:14px;color:#fff}.lt-head small{display:block;font-size:11.5px;color:var(--muted)}
        .lt-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-right:4px}
        .lt-row{display:flex;gap:9px;align-items:flex-start}.lt-row.user{flex-direction:row-reverse}
        .lt-av{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;flex:none;color:#fff;background:var(--grad)}
        .lt-bub{max-width:82%;padding:11px 14px;border-radius:14px;font-size:13.6px;line-height:1.55}
        .lt-bub.model{background:rgba(255,255,255,.03);border:1px solid var(--line);border-top-left-radius:5px}
        .lt-bub.user{background:var(--grad-soft);border:1px solid var(--line-2);border-top-right-radius:5px}
        .lt-shot{max-width:220px;width:100%;border-radius:10px;margin-bottom:8px;display:block;border:1px solid var(--line)}
        .lt-md :global(p){margin:0 0 8px}.lt-md :global(p:last-child){margin-bottom:0}
        .lt-md :global(h3),.lt-md :global(h4){margin:10px 0 6px;font-weight:800;color:#fff;font-size:14.5px}
        .lt-md :global(ul),.lt-md :global(ol){margin:5px 0 9px;padding-left:19px}.lt-md :global(li){margin:2px 0}
        .lt-md :global(strong){color:#fff;font-weight:800}
        .lt-md :global(code){background:rgba(217,70,239,.14);color:#f0abff;padding:1px 5px;border-radius:5px;font-size:12.5px}
        .lt-typing{display:flex;gap:5px;padding:2px}
        .lt-typing span{width:6px;height:6px;border-radius:50%;background:var(--magenta);opacity:.5;animation:ltb 1.2s infinite}
        .lt-typing span:nth-child(2){animation-delay:.2s}.lt-typing span:nth-child(3){animation-delay:.4s}
        @keyframes ltb{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
        .lt-preview{position:relative;width:60px;margin:10px 0 0}
        .lt-preview img{width:60px;height:60px;object-fit:cover;border-radius:10px;border:1px solid var(--line-2)}
        .lt-preview button{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;cursor:pointer;background:#1a1630;color:#fff;display:grid;place-items:center;border:1px solid var(--line-2)}
        .lt-inbar{display:flex;align-items:flex-end;gap:7px;margin-top:12px;border-radius:14px;padding:7px 7px 7px 11px;background:rgba(18,16,34,.82);border:1px solid var(--line-2)}
        .lt-inbar:focus-within{border-color:rgba(217,70,239,.5)}
        .lt-att{background:transparent;border:0;color:var(--muted);cursor:pointer;padding:5px;display:grid;place-items:center}
        .lt-att:hover{color:var(--magenta)}
        .lt-inbar textarea{flex:1;resize:none;background:transparent;border:0;outline:none;color:var(--text);font-family:inherit;font-size:13.6px;line-height:1.5;padding:6px 0;max-height:130px}
        .lt-inbar textarea::placeholder{color:#8b90ab}
        .lt-snd{width:36px;height:36px;border-radius:10px;border:0;cursor:pointer;flex:none;display:grid;place-items:center;color:#fff;background:var(--grad);box-shadow:var(--glow)}
        .lt-snd:disabled{opacity:.45;cursor:default;box-shadow:none}
      `}</style>
    </div>
  );
}
