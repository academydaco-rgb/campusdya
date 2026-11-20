"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [fmail, setFmail] = useState("");
  const [fmsg, setFmsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Partículas de fondo en movimiento
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let ps: P[] = [];
    const rs = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    rs();
    const N = Math.min(80, Math.round((w * h) / 26000));
    for (let i = 0; i < N; i++) ps.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.4 + 0.25 });
    const draw = () => {
      x.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) { x.strokeStyle = `rgba(90,170,255,${0.1 * (1 - d / 120)})`; x.lineWidth = 1; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); }
        }
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.3); x.fillStyle = `rgba(120,200,255,${p.a})`; x.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", rs);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", rs); };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function enviarReset(e: React.FormEvent) {
    e.preventDefault(); setFmsg("Enviando…");
    try { await api.post("/api/auth/forgot-password", { email: fmail.trim() }); setFmsg("Si el correo existe, te enviamos un enlace para restablecer tu contraseña."); }
    catch { setFmsg("Si el correo existe, te enviamos un enlace para restablecer tu contraseña."); }
  }

  return (
    <div className="lgn-auth">
      <canvas ref={canvasRef} className="lgn-pz" aria-hidden />
      <div className="lgn-glowl" aria-hidden /><div className="lgn-glowr" aria-hidden /><div className="lgn-glowt" aria-hidden />
      <div className="lgn-stars" aria-hidden /><div className="lgn-mesh" aria-hidden />
      <span className="lgn-sg" style={{ left: "22%", top: "18%" }} aria-hidden />
      <span className="lgn-sg s2" style={{ left: "40%", top: "70%" }} aria-hidden />
      <span className="lgn-sg s3" style={{ left: "12%", top: "52%" }} aria-hidden />
      <span className="lgn-sg s2" style={{ left: "62%", top: "30%" }} aria-hidden />
      <div className="lgn-vig" aria-hidden />

      {/* Izquierda · marca */}
      <section className="lgn-brand">
        <div className="lgn-logo"><img src="/logo.png" alt="Academy D&amp;A" /></div>
        <span className="lgn-eyebrow"><span className="d" />FORMACIÓN EN E-COMMERCE Y DROPSHIPPING</span>
        <h1>Tu negocio online, al siguiente nivel.</h1>
        <p className="lgn-lead">Diplomados, clases en vivo y acompañamiento 1 a 1. Todo en una sola plataforma hecha para que vendas más.</p>
        <div className="lgn-feats">
          <div className="lgn-feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg></span><span>Herramientas IA</span></div>
          <div className="lgn-feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg></span><span>Plataforma de estudio inteligente</span></div>
          <div className="lgn-feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg></span><span>Diplomados 100% actualizados</span></div>
          <div className="lgn-feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M15 11a3 3 0 1 0-1.5-5.6M3.5 19a5.5 5.5 0 0 1 11 0M15 14.5a5.5 5.5 0 0 1 5.5 4.5" /></svg></span><span>Comunidad interactiva de estudiantes</span></div>
        </div>
      </section>

      {/* Derecha · formulario */}
      <section className="lgn-panel">
        <div className="lgn-card">
          <div className="lgn-mob"><img src="/logo.png" alt="Academy D&amp;A" /></div>
          <h2>Inicia sesión</h2>
          <div className="lgn-sub">Bienvenido de nuevo. Continúa tu formación.</div>
          <form onSubmit={onSubmit}>
            <div className="lgn-field">
              <label className="lgn-lab">Correo</label>
              <input className="lgn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" required />
            </div>
            <div className="lgn-field">
              <label className="lgn-lab">Contraseña</label>
              <div className="lgn-pw">
                <input className="lgn-input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" required style={{ paddingRight: 44 }} />
                <button type="button" className="lgn-eye" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="lgn-row">
              <button type="button" onClick={() => { setForgot((v) => !v); setFmsg(""); }}>¿Olvidaste tu contraseña?</button>
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <button className="lgn-cta" disabled={loading}>{loading ? "Entrando…" : "Entrar al campus"}</button>
          </form>
          {forgot && (
            <form onSubmit={enviarReset} style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <input className="lgn-input" type="email" value={fmail} onChange={(e) => setFmail(e.target.value)} placeholder="Tu correo registrado" required />
              <button className="lgn-cta" style={{ animation: "none", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.18)", boxShadow: "none" }}>Enviar enlace de recuperación</button>
              {fmsg && <div className="lgn-sub" style={{ fontSize: 12.5, textAlign: "center", margin: 0 }}>{fmsg}</div>}
            </form>
          )}
          <div className="lgn-foot">Academy D&amp;A · campusdya.com</div>
        </div>
      </section>
      <div className="lgn-grain" aria-hidden />
    </div>
  );
}
