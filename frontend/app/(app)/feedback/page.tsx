"use client";
import { useEffect, useState } from "react";
import { api, uploadImageUser, FeedbackT, CommunityTopT } from "@/lib/api";

export default function Comunidad() {
  const [items, setItems] = useState<FeedbackT[]>([]);
  const [body, setBody] = useState("");
  const [results, setResults] = useState("");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState<FeedbackT | null>(null);
  const [profileData, setProfileData] = useState<{ name: string; avatar_url?: string | null; bio?: string | null; whatsapp?: string | null; profile_type?: string | null; badges: { id: string; name: string; icon?: string | null; image_url?: string | null }[] } | null>(null);
  const [top, setTop] = useState<CommunityTopT[]>([]);

  function abrirPerfil(f: FeedbackT) {
    setProfile(f); setProfileData(null);
    api.get<{ name: string; avatar_url?: string | null; bio?: string | null; whatsapp?: string | null; profile_type?: string | null; badges: { id: string; name: string; icon?: string | null; image_url?: string | null }[] }>(`/api/users/${f.user_id}/public`).then(setProfileData).catch(() => {});
  }

  async function load() { setItems(await api.get<FeedbackT[]>("/api/feedback")); }
  useEffect(() => { api.get<CommunityTopT[]>("/api/community/top").then(setTop).catch(() => {}); }, []);
  useEffect(() => { load().catch(() => setItems([])); }, []);

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setMsg("");
    try { setImage(await uploadImageUser(f)); } catch (ex) { setMsg(ex instanceof Error ? ex.message : "Error al subir"); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await api.post("/api/feedback", { body: body.trim(), results: results.trim() || null, rating, image_url: image });
    setBody(""); setResults(""); setRating(5); setImage(null); setMsg("¡Gracias por tu opinión! 🙌");
    setTimeout(() => setMsg(""), 2000); await load();
  }

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Comunidad 💬</h1>
        <p className="muted" style={{ marginTop: 6 }}>Cuéntanos cómo te ha parecido la plataforma y tus resultados. Puedes adjuntar una imagen.</p>
      </div>
      {top.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>🏅 Los más activos de la comunidad</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {top.map((u, i) => (
              <div key={u.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72 }}>
                <div style={{ position: "relative" }}>
                  <span style={{ width: 52, height: 52, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800, color: "#04141c",
                    border: i < 3 ? "2px solid var(--gold)" : "1px solid var(--line-2)",
                    background: u.avatar_url ? `center/cover url(${u.avatar_url})` : "var(--grad)" }}>{!u.avatar_url && (u.name || "A").charAt(0).toUpperCase()}</span>
                  {i < 3 && <span style={{ position: "absolute", top: -6, right: -6, fontSize: 15 }}>{["🥇","🥈","🥉"][i]}</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.15, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#d6d2ea" }}>{(u.name || "Alumno").split(" ")[0]}</span>
                <span className="muted" style={{ fontSize: 10 }}>{u.count} aportes</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={enviar} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div><label className="label">Tu opinión</label><textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="¿Qué te ha parecido la academia?" /></div>
        <div><label className="label">Tus resultados (opcional)</label><textarea className="input" rows={2} value={results} onChange={(e) => setResults(e.target.value)} placeholder="Ej: lancé mi primera tienda y vendí…" /></div>
        {image && (
          <div style={{ position: "relative", width: 180 }}>
            <img src={image} alt="" style={{ width: 180, borderRadius: 10, display: "block" }} />
            <button type="button" onClick={() => setImage(null)} className="btn btn-ghost" style={{ position: "absolute", top: 6, right: 6, padding: "2px 8px", fontSize: 12 }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div><label className="label">Calificación</label>
            <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
            </select>
          </div>
          <label className="btn btn-ghost" style={{ fontSize: 13 }}>
            {busy ? "Subiendo…" : "📷 Adjuntar imagen"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={subir} style={{ display: "none" }} />
          </label>
          <span style={{ flex: 1 }} />
          <button className="btn btn-primary">Publicar</button>
          {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
        </div>
        <span className="muted" style={{ fontSize: 11.5 }}>Formatos: PNG, JPG o WEBP · máx 3 MB.</span>
      </form>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {items.map((f) => (
          <div key={f.id} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ color: "var(--gold)", fontSize: 14 }}>{"★".repeat(f.rating || 5)}</div>
            <p style={{ fontSize: 14, marginTop: 8 }}>{f.body}</p>
            {f.results && <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>📈 {f.results}</p>}
            {f.image_url && <img src={f.image_url} alt="" style={{ marginTop: 10, width: "100%", borderRadius: 10, display: "block" }} />}
            <button onClick={() => abrirPerfil(f)} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "transparent", border: 0, cursor: "pointer", padding: 0, color: "var(--text)" }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#04141c", background: f.author_avatar ? `center/cover url(${f.author_avatar})` : "var(--grad)" }}>{!f.author_avatar && (f.author_name || "A").charAt(0).toUpperCase()}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{f.author_name || "Alumno"}</span>
              <span className="muted" style={{ fontSize: 11 }}>· ver perfil</span>
            </button>
          </div>
        ))}
        {items.length === 0 && <span className="muted">Sé el primero en dejar tu opinión.</span>}
      </div>

      {profile && (
        <div onClick={() => setProfile(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(3,5,10,.72)", display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 420, padding: 26, textAlign: "center", position: "relative" }}>
            <button onClick={() => setProfile(null)} className="btn btn-ghost" style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", fontSize: 13 }}>✕</button>
            {(() => { const av = profileData?.avatar_url ?? profile.author_avatar; const nm = profileData?.name || profile.author_name || "Alumno"; const bio = profileData?.bio ?? profile.author_bio; const badges = profileData?.badges || []; return (<>
            <div style={{ width: 92, height: 92, borderRadius: 999, margin: "0 auto", border: "1px solid var(--line-2)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 34, color: "#04141c", background: av ? `center/cover url(${av})` : "var(--grad)" }}>{!av && nm.charAt(0).toUpperCase()}</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 14, color: "#fff" }}>{nm}</div>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 8, whiteSpace: "pre-wrap" }}>{bio || "Este alumno aún no ha escrito su descripción."}</p>
            {profileData?.profile_type && (
              <span className="chip" style={{ marginTop: 10, display: "inline-block", textTransform: "capitalize", color: "var(--cyan)" }}>
                {profileData.profile_type === "dropshipper" ? "🛒 Dropshipper" : profileData.profile_type === "proveedor" ? "📦 Proveedor" : "🏬 Bodega"}
              </span>
            )}
            {profileData?.whatsapp && (
              <div style={{ marginTop: 12 }}>
                <a className="btn btn-wa" style={{ padding: "9px 16px", fontSize: 13 }}
                  href={`https://wa.me/${profileData.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                  <svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5z"/></svg>
                  Escribir por WhatsApp
                </a>
              </div>
            )}
            {badges.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Insignias</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {badges.map((b) => b.image_url
                    ? <img key={b.id} src={b.image_url} alt={b.name} title={b.name} style={{ width: 46, height: 46, objectFit: "contain", filter: "drop-shadow(0 0 10px var(--gold))" }} />
                    : <div key={b.id} title={b.name} style={{ fontSize: 34, filter: "drop-shadow(0 0 10px var(--gold))" }}>{b.icon || "🏅"}</div>)}
                </div>
              </div>
            )}
            </>); })()}
          </div>
        </div>
      )}
    </div>
  );
}
