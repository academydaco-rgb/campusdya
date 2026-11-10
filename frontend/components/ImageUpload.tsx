"use client";
import { useState } from "react";
import { uploadImage } from "@/lib/api";

export default function ImageUpload({ value, onChange, hint, ratio = "wide" }: {
  value?: string | null; onChange: (url: string) => void; hint: string; ratio?: "square" | "wide";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr("");
    try { onChange(await uploadImage(f)); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Error al subir"); }
    finally { setBusy(false); e.target.value = ""; }
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: ratio === "square" ? 64 : 112, height: 64, borderRadius: 10, border: "1px solid var(--line)", flexShrink: 0,
          background: value ? `center/cover url(${value})` : "rgba(5,8,15,.6)" }} />
        <label className="btn btn-ghost" style={{ fontSize: 13 }}>
          {busy ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          <input type="file" accept="image/*,.heic,.heif" onChange={pick} style={{ display: "none" }} />
        </label>
        <span className="muted" style={{ fontSize: 12 }}>{hint}</span>
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  );
}
