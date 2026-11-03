"use client";
import { useEffect, useState } from "react";
import { api, FeedbackT } from "@/lib/api";

export default function Comunidad() {
  const [items, setItems] = useState<FeedbackT[]>([]);
  const [body, setBody] = useState("");
  const [results, setResults] = useState("");
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState("");

  async function load() { setItems(await api.get<FeedbackT[]>("/api/feedback")); }
  useEffect(() => { load().catch(() => setItems([])); }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await api.post("/api/feedback", { body: body.trim(), results: results.trim() || null, rating });
    setBody(""); setResults(""); setRating(5); setMsg("¡Gracias por tu opinión! 🙌");
    setTimeout(() => setMsg(""), 2000); await load();
  }

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Comunidad 💬</h1>
        <p className="muted" style={{ marginTop: 6 }}>Cuéntanos cómo te ha parecido la plataforma y tus resultados.</p>
      </div>
      <form onSubmit={enviar} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div><label className="label">Tu opinión</label><textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="¿Qué te ha parecido la academia?" /></div>
        <div><label className="label">Tus resultados (opcional)</label><textarea className="input" rows={2} value={results} onChange={(e) => setResults(e.target.value)} placeholder="Ej: lancé mi primera tienda y vendí…" /></div>
        <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
          <div><label className="label">Calificación</label>
            <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary">Publicar</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </form>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {items.map((f) => (
          <div key={f.id} className="card" style={{ padding: 18 }}>
            <div style={{ color: "var(--amber)", fontSize: 14 }}>{"★".repeat(f.rating || 5)}</div>
            <p style={{ fontSize: 14, marginTop: 8 }}>{f.body}</p>
            {f.results && <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>📈 {f.results}</p>}
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>— {f.author_name || "Alumno"}</div>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Sé el primero en dejar tu opinión.</span>}
      </div>
    </div>
  );
}
