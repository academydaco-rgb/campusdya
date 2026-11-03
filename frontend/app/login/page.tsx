"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" required style={{ marginBottom: 20 }} />
          {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <div className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>D&A Academy · campusdya.com</div>
      </div>
    </div>
  );
}
