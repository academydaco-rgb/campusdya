"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

function ResetInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp?.get("token") || "";
  const [nw, setNw] = useState(""); const [nw2, setNw2] = useState("");
  const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (nw.length < 6) { setMsg("La contraseña debe tener al menos 6 caracteres"); return; }
    if (nw !== nw2) { setMsg("Las contraseñas no coinciden"); return; }
    try {
      await api.post("/api/auth/reset-password", { token, new_password: nw });
      setOk(true); setMsg("¡Contraseña actualizada! Ya puedes iniciar sesión.");
      setTimeout(() => router.replace("/login"), 2200);
    } catch (err) { setMsg(err instanceof Error ? err.message : "No se pudo restablecer"); }
  }

  return (
    <div className="login-sky">
      <div className="login-aurora" aria-hidden />
      <div className="login-stars" aria-hidden />
      <div className="login-card">
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="Campus D&A" style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 24px rgba(0,255,255,.4))" }} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 22, marginTop: 4, color: "#fff" }}>Restablecer contraseña</h1>
        {!token ? (
          <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>Enlace inválido. Solicita uno nuevo desde «¿Olvidaste tu contraseña?».</p>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 20 }}>
            <label className="label">Nueva contraseña</label>
            <input className="input" type="password" value={nw} onChange={(e) => setNw(e.target.value)} required style={{ marginBottom: 16 }} />
            <label className="label">Repetir contraseña</label>
            <input className="input" type="password" value={nw2} onChange={(e) => setNw2(e.target.value)} required style={{ marginBottom: 18 }} />
            {msg && <div style={{ color: ok ? "var(--cyan)" : "var(--danger)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{msg}</div>}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={ok}>Guardar contraseña</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return <Suspense fallback={<div className="login-sky"><span className="muted">Cargando…</span></div>}><ResetInner /></Suspense>;
}
