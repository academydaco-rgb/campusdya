"use client";
import { useEffect, useState } from "react";
import { api, UserT, AdminDiplomaT, EnrollmentT } from "@/lib/api";

export default function AdminEnrollments() {
  const [users, setUsers] = useState<UserT[]>([]);
  const [diplomas, setDiplomas] = useState<AdminDiplomaT[]>([]);
  const [diplomaId, setDiplomaId] = useState("");
  const [userId, setUserId] = useState("");
  const [enrolled, setEnrolled] = useState<EnrollmentT[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get<UserT[]>("/api/admin/users").then(setUsers).catch(() => {});
    api.get<AdminDiplomaT[]>("/api/admin/diplomas").then(setDiplomas).catch(() => {});
  }, []);

  async function loadEnrolled(did: string) {
    setDiplomaId(did);
    if (!did) { setEnrolled([]); return; }
    setEnrolled(await api.get<EnrollmentT[]>(`/api/admin/enrollments?diploma_id=${did}`));
  }

  async function inscribir() {
    if (!userId || !diplomaId) { setMsg("Elige usuario y diplomado"); return; }
    await api.post("/api/admin/enrollments", { user_id: userId, diploma_id: diplomaId });
    setUserId(""); setMsg("Inscrito ✓"); setTimeout(() => setMsg(""), 1500);
    await loadEnrolled(diplomaId);
  }
  async function quitar(eid: string) { await api.del(`/api/admin/enrollments/${eid}`); await loadEnrolled(diplomaId); }

  const userName = (uid: string) => users.find((u) => u.id === uid)?.name || uid;

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div><label className="label">Diplomado</label>
          <select className="input" value={diplomaId} onChange={(e) => loadEnrolled(e.target.value)}>
            <option value="">— elige un diplomado —</option>
            {diplomas.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        {diplomaId && (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr auto", alignItems: "end" }}>
            <div><label className="label">Dar acceso a</label>
              <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">— elige un usuario —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={inscribir} type="button">Inscribir</button>
          </div>
        )}
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>

      {diplomaId && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Alumnos con acceso ({enrolled.length})</div>
          <div className="grid" style={{ gap: 8 }}>
            {enrolled.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "#0b0e17" }}>
                <span style={{ flex: 1, fontSize: 14 }}>{userName(e.user_id)}</span>
                <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => quitar(e.id)} type="button">Quitar</button>
              </div>
            ))}
            {enrolled.length === 0 && <span className="muted">Nadie inscrito aún.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
