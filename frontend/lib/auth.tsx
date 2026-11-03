"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, UserT } from "@/lib/api";

interface AuthCtx {
  user: UserT | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, loading: true, login: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<UserT>("/api/auth/me");
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post<{ access_token: string; user: UserT }>("/api/auth/login", { email, password });
    try { localStorage.setItem("academia_token", r.access_token); } catch { /* ignore */ }
    setUser(r.user);
  }

  function logout() {
    try { localStorage.removeItem("academia_token"); } catch { /* ignore */ }
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
