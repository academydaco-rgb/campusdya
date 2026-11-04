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
    <div className="login-sky">
      {/* galaxia */}
      <div className="login-aurora" aria-hidden />
      <div className="login-stars" aria-hidden />
      <div className="login-orbits" aria-hidden>
        <span className="orbit o1" /><span className="orbit o2" /><span className="orbit o3" />
      </div>

      <div className="login-card">
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="Campus D&A" style={{ width: 150, height: 150, objectFit: "contain", filter: "drop-shadow(0 0 28px rgba(0,255,255,.45))" }} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 24, marginTop: 4, color: "#fff" }}>Campus D&A</h1>
        <p className="muted" style={{ textAlign: "center", marginTop: 6, marginBottom: 26, fontSize: 14 }}>
          Tu universo de aprendizaje para el e-commerce
        </p>
        <form onSubmit={onSubmit}>
          <label className="label">Correo</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@gmail.com" required style={{ marginBottom: 16 }} />
          <label className="label">Contraseña</label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input className="input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required style={{ marginBottom: 0, paddingRight: 44, width: "100%" }} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", color: "var(--muted, #8aa)", cursor: "pointer", padding: 0 }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button type="button" onClick={() => { setForgot((v) => !v); setFmsg(""); }} style={{ background: "transparent", border: 0, color: "var(--cyan)", cursor: "pointer", fontSize: 13 }}>¿Olvidaste tu contraseña?</button>
        </div>
        {forgot && (
          <form onSubmit={enviarReset} style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input className="input" type="email" value={fmail} onChange={(e) => setFmail(e.target.value)} placeholder="Tu correo registrado" required />
            <button className="btn btn-ghost" style={{ justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}>Enviar enlace de recuperación</button>
            {fmsg && <div className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>{fmsg}</div>}
          </form>
        )}
        <div className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>D&A Academy · campusdya.com</div>
      </div>
    </div>
  );
}
