"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, UniverseT, PhaseT, DiplomaCardT } from "@/lib/api";

export default function UniversoPage() {
  const router = useRouter();
  const [data, setData] = useState<UniverseT | null>(null);
  const [active, setActive] = useState<PhaseT | null>(null);

  useEffect(() => { api.get<UniverseT>("/api/phases").then(setData).catch(() => setData(null)); }, []);

  function openDiploma(d: DiplomaCardT) {
    if (!d.enrolled) return;
    router.push(`/diplomado/${d.slug}`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>El Universo D&A 🌌</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 24 }}>Toca una fase (planeta) y despliega sus diplomados.</p>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 22 }}>
        {(data?.phases || []).map((p, i) => {
          const color = p.color || "#a855f7";
          const isActive = active?.id === p.id;
          return (
            <motion.button key={p.id} onClick={() => setActive(isActive ? null : p)}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              className="card" style={{ padding: 24, textAlign: "center", position: "relative", overflow: "hidden",
                borderColor: isActive ? color : "var(--border)", cursor: "pointer" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120px 120px at 50% 0%, ${color}22, transparent 70%)` }} />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                style={{ fontSize: 44, lineHeight: 1, filter: `drop-shadow(0 0 18px ${color})` }}>{p.icon || "🪐"}</motion.div>
              <div style={{ fontWeight: 800, marginTop: 12 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{p.diplomas.length} diplomados</div>
            </motion.button>
          );
        })}
      </div>

      {active && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18 }}>{active.icon} {active.name}</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{active.description}</p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 16 }}>
            {active.diplomas.length === 0 && <span className="muted">Pronto habrá diplomados en esta fase.</span>}
            {active.diplomas.map((d) => (
              <div key={d.id} onClick={() => openDiploma(d)} className={`card ${d.enrolled ? "" : "lock"}`}
                style={{ overflow: "hidden", cursor: d.enrolled ? "pointer" : "not-allowed" }}>
                <div style={{ height: 120, background: d.cover_url ? `center/cover url(${d.cover_url})` : `linear-gradient(135deg, ${active.color || "#a855f7"}33, #0b1020)` }} />
                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>{d.title}</span>
                  {!d.enrolled && <span title="Sin acceso">🔒</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
