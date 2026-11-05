"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

interface VerifyT { valid: boolean; code?: string; student_name?: string; diploma_title?: string; awarded_at?: string | null; }

export default function Verificar() {
  const params = useParams<{ code: string }>();
  const code = params?.code as string;
  const [data, setData] = useState<VerifyT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`${API_URL}/api/certificates/verify/${code}`)
      .then((r) => r.json()).then(setData).catch(() => setData({ valid: false }))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="login-sky">
      <div className="login-aurora" aria-hidden />
      <div className="login-stars" aria-hidden />
      <div className="login-card" style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="D&A Academy" style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 22px rgba(0,255,255,.4))" }} />
        <h1 style={{ fontSize: 20, marginTop: 4, color: "#fff" }}>Verificación de certificado</h1>
        {loading ? (
          <p className="muted" style={{ marginTop: 18 }}>Verificando…</p>
        ) : data?.valid ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(52,211,153,.14)", color: "#34d399", fontWeight: 800, fontSize: 13 }}>✓ Certificado válido</div>
            <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Este certificado acredita que</p>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginTop: 6 }}>{data.student_name}</div>
            <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>completó el diplomado</p>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)", marginTop: 4 }}>{data.diploma_title}</div>
            {data.awarded_at && <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>Otorgado el {new Date(data.awarded_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</div>}
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Código: {data.code}</div>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(248,113,113,.14)", color: "var(--danger)", fontWeight: 800, fontSize: 13 }}>✕ No encontrado</div>
            <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>Este código de certificado no existe o no es válido.</p>
          </div>
        )}
        <div className="muted" style={{ fontSize: 12, marginTop: 24 }}>D&A Academy · campusdya.com</div>
      </div>
    </div>
  );
}
