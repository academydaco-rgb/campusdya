"use client";
import { useState } from "react";
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
      {/* Izquierda · marca */}
      <section className="lgn-brand">
        <div className="lgn-lock">
          <img src="/logo.png" alt="Academy D&amp;A" />
          <div className="lgn-wm">Academy <span>D&amp;A</span><small>CAMPUS E-COMMERCE</small></div>
        </div>
        <h1>Construye y escala tu negocio online.</h1>
        <p className="lgn-lead">El campus de Academy D&amp;A: diplomados paso a paso, clases en vivo y acompañamiento 1 a 1 para emprendedores.</p>
        <div className="lgn-stats">
          <div className="lgn-st"><b>1.700</b><span>Estudiantes activos</span></div>
          <div className="lgn-st"><b>80<em>%</em></b><span>Casos de éxito</span></div>
          <div className="lgn-st"><b>32</b><span>Departamentos</span></div>
        </div>
        <div className="lgn-ally"><span className="d" />Con alianzas en 18 países de América Latina y Europa</div>
      </section>

      {/* Derecha · formulario */}
      <section className="lgn-panel">
        <div className="lgn-form">
          <div className="lgn-mob">
            <img src="/logo.png" alt="Academy D&amp;A" />
            <div className="lgn-wm">ACADEMY <span>D&amp;A</span></div>
          </div>
          <div className="lgn-head">
            <h2>Inicia sesión</h2>
            <div className="lgn-sub">Bienvenido de nuevo. Continúa tu formación.</div>
          </div>
          <form onSubmit={onSubmit}>
            <div className="lgn-field">
              <label className="lgn-lab">Correo</label>
              <input className="lgn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" required />
            </div>
            <div className="lgn-field">
              <label className="lgn-lab">Contraseña</label>
              <div className="lgn-pw">
                <input className="lgn-input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" required style={{ paddingRight: 44 }} />
                <button type="button" className="lgn-eye" onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
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
              <button className="lgn-cta" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.18)", boxShadow: "none" }}>Enviar enlace de recuperación</button>
              {fmsg && <div className="lgn-sub" style={{ fontSize: 12.5, textAlign: "center" }}>{fmsg}</div>}
            </form>
          )}
          <div className="lgn-foot"><b>Academy D&amp;A</b> · campusdya.com</div>
        </div>
      </section>
      <div className="lgn-vig" aria-hidden />
      <div className="lgn-grain" aria-hidden />
    </div>
  );
}
