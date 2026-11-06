"use client";
import { useEffect, useState } from "react";
import { api, OnlineUserT } from "@/lib/api";

export default function OnlineBar() {
  const [users, setUsers] = useState<OnlineUserT[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try { await api.post("/api/me/ping", {}); } catch { /* noop */ }
      try {
        const rows = await api.get<OnlineUserT[]>("/api/online-users");
        if (alive) setUsers(rows);
      } catch { /* noop */ }
    }
    tick();
    const id = setInterval(tick, 45000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="onlinebar">
      {open ? (
        <div className="onlinebar-panel">
          <div className="onlinebar-head">
            <span className="onlinebar-dot" />
            <span className="onlinebar-title">Usuarios activos</span>
            <span className="onlinebar-count">{users.length}</span>
            <button className="onlinebar-x" onClick={() => setOpen(false)} aria-label="Ocultar">×</button>
          </div>
          <div className="onlinebar-row">
            {users.slice(0, 14).map((u) => (
              <span key={u.id} className="onlinebar-av" title={u.name}
                style={{ background: u.avatar_url ? `center/cover url(${u.avatar_url})` : "var(--grad)" }}>
                {!u.avatar_url && (u.name || "A").charAt(0).toUpperCase()}
              </span>
            ))}
            {users.length > 14 && <span className="onlinebar-more">+{users.length - 14}</span>}
          </div>
        </div>
      ) : (
        <button className="onlinebar-bubble" onClick={() => setOpen(true)} title="Usuarios activos">
          <span className="onlinebar-dot" />
          {users.length}
        </button>
      )}
    </div>
  );
}
