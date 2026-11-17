"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import SectionHero from "@/components/SectionHero";
import { Flame } from "lucide-react";

type Gami = {
  level: number; title: string; xp: number; into: number; need: number; pct: number;
  next_at: number; streak_current: number; streak_longest: number; rank: number; week_xp: number;
};
type Row = {
  rank: number; user_id: string; name: string; avatar_url?: string | null;
  xp: number; level: number; title: string; is_me: boolean;
};

const AVS = ["#6d28d9,#22e0ff", "#0891b2,#06b6d4", "#7c3aed,#d946ef", "#166534,#22e67a", "#be185d,#fb7185", "#b45309,#f6c453", "#1d4ed8,#22e0ff", "#4338ca,#8b5cf6"];
function avGrad(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `linear-gradient(135deg,${AVS[h % AVS.length]})`;
}
const fmt = (n: number) => (n || 0).toLocaleString("es-CO");

export default function Ranking() {
  const { user } = useAuth();
  const [g, setG] = useState<Gami | null>(null);
  const [period, setPeriod] = useState<"all" | "week">("all");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => { api.get<Gami>("/api/me/gamification").then(setG).catch(() => {}); }, []);
  useEffect(() => { api.get<Row[]>(`/api/leaderboard?period=${period}`).then(setRows).catch(() => setRows([])); }, [period]);

  const first = (user?.name || "").split(" ")[0] || "crack";
  const C = 2 * Math.PI * 46;

  return (
    <div>
      <SectionHero
        icon={<Flame size={14} />}
        badge="Tu progreso"
        title="Ranking"
        subtitle="Gana XP estudiando tus lecciones, mantén tu racha de días activos y escala posiciones frente a tus compañeros."
      />

      {g && (
        <div className="gm-me">
          <div className="gm-ring">
            <svg width="104" height="104">
              <circle cx="52" cy="52" r="46" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
              <circle cx="52" cy="52" r="46" fill="none" stroke="url(#gmg)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - g.pct / 100)} transform="rotate(-90 52 52)" />
              <defs>
                <linearGradient id="gmg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#22e0ff" /><stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="gm-lv"><b>{g.level}</b><span>{g.title}</span></div>
          </div>
          <div className="gm-mid">
            <div className="gm-metitle">Vas muy bien, {first}</div>
            <div className="gm-mesub">Puesto #{g.rank} · {fmt(g.xp)} XP acumulados</div>
            <div className="gm-xpbar"><i style={{ width: `${g.pct}%` }} /></div>
            <div className="gm-xpmeta">
              <span>Nivel {g.level} · {g.title}</span>
              <span>{g.into < g.need ? `Faltan ${fmt(g.need - g.into)} XP para subir de nivel` : "Nivel máximo"}</span>
            </div>
          </div>
          <div className="gm-streak">
            <Flame size={28} color="#fb923c" fill="#fb923c" />
            <div className="gm-n">{g.streak_current}</div>
            <div className="gm-sl">{g.streak_current === 1 ? "día seguido" : "días seguidos"}</div>
            <div className="gm-best">Tu mejor racha: {g.streak_longest}</div>
          </div>
        </div>
      )}

      <div className="gm-lb">
        <div className="gm-lbhead">
          <h2>Tabla de posiciones</h2>
          <div className="gm-seg">
            <button className={period === "all" ? "on" : ""} onClick={() => setPeriod("all")}>General</button>
            <button className={period === "week" ? "on" : ""} onClick={() => setPeriod("week")}>Esta semana</button>
          </div>
        </div>
        {rows.length === 0 && <div className="gm-empty">Aún no hay movimiento. ¡Empieza a estudiar para aparecer aquí!</div>}
        {rows.map((r) => (
          <div key={r.user_id} className={`gm-row${r.is_me ? " me" : ""}`}>
            {r.rank <= 3 ? <div className={`gm-medal m${r.rank}`}>{r.rank}</div> : <div className="gm-rk">{r.rank}</div>}
            <div className="gm-av" style={r.avatar_url ? { backgroundImage: `url(${r.avatar_url})` } : { background: avGrad(r.user_id) }}>
              {!r.avatar_url && r.name.charAt(0).toUpperCase()}
            </div>
            <div className="gm-who"><b>{r.name}{r.is_me ? " (tú)" : ""}</b><span>Nivel {r.level} · {r.title}</span></div>
            <div className="gm-xp">{fmt(r.xp)} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
