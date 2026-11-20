"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

type Cover = { title: string; cover_url?: string | null; subtitle?: string; bg?: string };

// Portadas de respaldo (si aún no hay endpoint o no hay diplomados con portada).
const FALLBACK: Cover[] = [
  { title: "Meta Ads", subtitle: "Publicidad que vende", bg: "linear-gradient(145deg,#12233f,#0a1120)" },
  { title: "TikTok Ads", subtitle: "Escala con video", bg: "linear-gradient(145deg,#1d1030,#0c0a1c)" },
  { title: "Logística", subtitle: "Entregas sin fallas", bg: "linear-gradient(145deg,#0f2a2b,#081417)" },
  { title: "Ventas", subtitle: "Cierra como pro", bg: "linear-gradient(145deg,#2a1836,#120a1e)" },
  { title: "Mentalidad", subtitle: "Hábitos de emprendedor", bg: "linear-gradient(145deg,#102338,#0a111f)" },
  { title: "Redes Sociales", subtitle: "Marca que atrae", bg: "linear-gradient(145deg,#231a3a,#100b1e)" },
];
const ROTS = [-3, 2, -2, 3, -3, 2];

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

  // Portadas reales de diplomados + animación "boom"
  const [covers, setCovers] = useState<Cover[]>(FALLBACK);
  const [flashes, setFlashes] = useState<{ key: number; cover: Cover; rot: number }[]>([]);

  useEffect(() => {
    api.get<{ title: string; cover_url: string }[]>("/api/public/diploma-covers")
      .then((d) => { if (Array.isArray(d) && d.length) setCovers(d); })
      .catch(() => { /* se queda con FALLBACK */ });
  }, []);

  useEffect(() => {
    if (!covers.length) return;
    let i = 0, k = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const spawn = () => {
      const cover = covers[i % covers.length];
      const rot = ROTS[i % ROTS.length];
      const key = k++;
      setFlashes((a) => [...a, { key, cover, rot }]);
      timers.push(setTimeout(() => setFlashes((a) => a.filter((x) => x.key !== key)), 2800));
      i++;
    };
    spawn();
    const id = setInterval(spawn, 2200);
    return () => { clearInterval(id); timers.forEach(clearTimeout); };
  }, [covers]);

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
      <div className="lgn-aura" aria-hidden />
      <div className="lgn-stars" aria-hidden />
      <div className="lgn-grid" aria-hidden />

      {/* Panel marca */}
      <section className="lgn-brand">
        <span className="lgn-badge"><span className="lgn-dot" />CAMPUS D&amp;A · ACCESO</span>
        <div className="lgn-logo"><span className="lgn-halo" /><span className="lgn-ring" /><img src="/logo.png" alt="Academy D&amp;A" /></div>
        <h1>Entra a tu universo del e&#8209;commerce</h1>
        <p className="lgn-lead">Diplomados paso a paso, clases en vivo, comunidad y seguimiento de tu progreso. Todo en un solo campus.</p>
        <div className="lgn-stats">
          <div><b>+30</b><span>Diplomados</span></div>
          <div><b>Clases</b><span>en vivo</span></div>
          <div><b>24/7</b><span>Acceso total</span></div>
        </div>
      </section>

      {/* Escenario de diplomados tipo boom */}
      <div className="lgn-stage" aria-hidden>
        <div className="lgn-glowfloor" />
        {flashes.map((f) => (
          <div key={f.key} className="lgn-flash" style={{ ["--rot" as string]: `${f.rot}deg` }}>
            <div className="lgn-cover">
              <div className="lgn-img" style={{ background: f.cover.cover_url ? `center/cover no-repeat url(${f.cover.cover_url})` : (f.cover.bg || "linear-gradient(145deg,#12233f,#0a1120)") }} />
              <div className="lgn-shade" />
              <span className="lgn-eyebrow">DIPLOMADO</span>
              <div className="lgn-cvttl"><h4>{f.cover.title}</h4>{f.cover.subtitle ? <p>{f.cover.subtitle}</p> : null}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <section className="lgn-panel">
        <div className="lgn-card">
          <div className="lgn-mobrand"><div className="lgn-logo"><span className="lgn-halo" /><span className="lgn-ring" /><img src="/logo.png" alt="Academy D&amp;A" /></div></div>
          <h2>Bienvenido de nuevo</h2>
          <div className="lgn-sub">Inicia sesión para continuar tu formación</div>
          <form onSubmit={onSubmit}>
            <label className="label">Correo</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@gmail.com" required style={{ marginBottom: 16 }} />
            <label className="label">Contraseña</label>
            <div className="lgn-pw" style={{ marginBottom: 22 }}>
              <input className="input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required style={{ paddingRight: 44 }} />
              <button type="button" className="lgn-eye" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <button className="lgn-cta" disabled={loading}>{loading ? "Entrando…" : "Entrar al campus →"}</button>
          </form>
          <button type="button" className="lgn-forgot" onClick={() => { setForgot((v) => !v); setFmsg(""); }}>¿Olvidaste tu contraseña?</button>
          {forgot && (
            <form onSubmit={enviarReset} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input className="input" type="email" value={fmail} onChange={(e) => setFmail(e.target.value)} placeholder="Tu correo registrado" required />
              <button className="btn btn-ghost" style={{ justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}>Enviar enlace de recuperación</button>
              {fmsg && <div className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>{fmsg}</div>}
            </form>
          )}
          <div className="lgn-foot">Academy D&amp;A · campusdya.com</div>
        </div>
      </section>
    </div>
  );
}
