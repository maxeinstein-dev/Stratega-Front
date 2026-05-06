/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { api, tokenStore, userStore } from "./api";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(() => userStore.get());
  const [ready, setReady] = useState(true);

  const login = useCallback(async (email, password) => {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });

    const token = res.accessToken || res.token || res.id_token;
    
    if (!token) {
      console.error("[auth] NO TOKEN IN RESPONSE!", res);
      throw new Error("Server did not return a token");
    }

    const payload = decodeJwt(token);
    if (import.meta.env.DEV) {
      console.debug("[auth] Login response:", res);
      console.debug("[auth] Token Payload:", payload);
    }

    tokenStore.set(token);
    
    // Improved user reconstruction from JWT
    const nextUser = res.user || {
      id: payload.sub ?? payload.userId ?? payload.id ?? "",
      name: payload.name || payload.given_name || email.split("@")[0],
      email: payload.email || email,
    };
    userStore.set(nextUser);

    flushSync(() => {
      setToken(token);
      setUser(nextUser);
    });
  }, []);

  const register = useCallback(
    async (name, email, password) => {
      const created = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        auth: false,
      });
      userStore.set(created);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    flushSync(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated: !!token, ready, user, token, login, register, logout }),
    [ready, token, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      return {
        isAuthenticated: !!tokenStore.get(),
        ready: true,
        user: userStore.get(),
        token: tokenStore.get(),
        login: async () => {},
        register: async () => {},
        logout: () => {},
      };
    }
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}


