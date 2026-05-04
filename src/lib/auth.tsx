import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore, userStore, type StoredUser } from "./api";

type AuthState = {
  isAuthenticated: boolean;
  user: StoredUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function decodeJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? payload.userId ?? payload.id ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setToken(tokenStore.get());
    setUser(userStore.get());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    tokenStore.set(res.token);
    setToken(res.token);
    const existing = userStore.get();
    if (existing && existing.email === email) {
      setUser(existing);
    } else {
      const id = decodeJwtSub(res.token) ?? "";
      const u = { id, name: email.split("@")[0], email };
      userStore.set(u);
      setUser(u);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const created = await api<StoredUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      auth: false,
    });
    userStore.set(created);
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: !!token, user, token, login, register, logout }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
