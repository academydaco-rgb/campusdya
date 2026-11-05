"use client";
import { useState } from "react";
import { AnnouncementT } from "@/lib/api";
import { Megaphone, ChevronLeft, ChevronRight, X } from "lucide-react";

function fdate(d: string) {
  try { return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }); } catch { return ""; }
}

export default function NewsBlock({ news }: { news: AnnouncementT[] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<AnnouncementT | null>(null);
  const n = news[i];

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="sec-h">
        <span className="ic"><Megaphone /></span>
        <h2>Noticias importantes</h2>
        {news.length > 1 && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="newsarrow" onClick={() => setI((v) => (v - 1 + news.length) % news.length)} aria-label="Anterior"><ChevronLeft size={16} /></button>
            <button className="newsarrow" onClick={() => setI((v) => (v + 1) % news.length)} aria-label="Siguiente"><ChevronRight size={16} /></button>
          </span>
        )}
      </div>

      {!n ? (
        <span className="muted" style={{ fontSize: 13 }}>Aquí verás los comunicados de la academia.</span>
      ) : (
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 92, height: 74, borderRadius: 12, flex: "none", display: "grid", placeItems: "center", overflow: "hidden", background: n.image_url ? `center/cover url(${n.image_url})` : "linear-gradient(150deg,#2a1250,#141140)", color: "#e8b3ff", border: "1px solid var(--line-2)" }}>
            {!n.image_url && <Megaphone size={26} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: "5px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</p>
            <button onClick={() => setOpen(n)} style={{ marginTop: 8, background: "none", border: 0, color: "#d08bff", fontWeight: 700, fontSize: 12.5, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>Leer más <ChevronRight size={14} /></button>
          </div>
        </div>
      )}
      {news.length > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {news.map((_, k) => <i key={k} onClick={() => setI(k)} style={{ width: 7, height: 7, borderRadius: 999, cursor: "pointer", background: k === i ? "var(--magenta)" : "rgba(255,255,255,.2)" }} />)}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(4,4,10,.72)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "86vh", overflow: "auto", borderColor: "var(--line-2)" }}>
            {open.image_url && <div style={{ width: "100%", aspectRatio: "16/7", background: `center/cover url(${open.image_url})` }} />}
            <div style={{ padding: 24, position: "relative" }}>
              <button onClick={() => setOpen(null)} aria-label="Cerrar" style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: 10, border: "1px solid var(--line)", background: "rgba(255,255,255,.05)", color: "#cbb8ff", display: "grid", placeItems: "center" }}><X size={18} /></button>
              <span className="eyebrow" style={{ color: "#c9b7ff" }}>Comunicado</span>
              <h2 style={{ fontSize: 24, margin: "8px 40px 0 0", color: "#fff", lineHeight: 1.15 }}>{open.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 16px" }}>
                {open.teacher_name && (
                  <>
                    <div style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, background: open.teacher_photo_url ? `center/cover url(${open.teacher_photo_url})` : "var(--grad)" }} />
                    <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{open.teacher_name}</span>
                    <span className="muted" style={{ fontSize: 11 }}>·</span>
                  </>
                )}
                <span className="muted" style={{ fontSize: 12.5 }}>{fdate(open.created_at)}</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#d6d8ea", whiteSpace: "pre-wrap" }}>{open.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
