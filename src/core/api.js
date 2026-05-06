const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
export const API_BASE = RAW_BASE.replace(/\/$/, "") || (import.meta.env.DEV ? "/api" : "");

const TOKEN_KEY = "stratega.token";
const USER_KEY = "stratega.user";

export const tokenStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return null;
    const token = t.trim();
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
    } catch {
      return null; // Malformed token
    }
    return token;
  },
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  set: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api(path, opts = {}) {
  const { auth = true, ...fetchOpts } = opts;
  const isDev = import.meta.env.DEV;

  if (!API_BASE) {
    throw new ApiError(
      "API base URL not configured. Set VITE_API_BASE_URL in your environment.",
      0,
    );
  }

  const headers = new Headers(fetchOpts.headers);
  headers.set("Accept", "application/json");
  const isFormData = fetchOpts.body instanceof FormData;
  if (fetchOpts.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth !== false) {
    const token = tokenStore.get();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      if (isDev) console.debug(`[api] Auth: Bearer ${token.substring(0, 10)}...`);
    } else if (isDev) {
      console.warn("[api] Missing token for authenticated request", { path });
    }
  }

  const url = `${API_BASE}${path}`;
  const method = (fetchOpts.method ?? "GET").toUpperCase();

  if (isDev) {
    console.debug(`[api] ${method} ${url}`, {
      headers: redactHeaders(headers),
      body: previewBody(fetchOpts.body)
    });
  }

  let res;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    res = await fetch(url, { ...fetchOpts, headers, signal: controller.signal });
  } catch (error) {
    const message = error.name === "AbortError" ? "A requisição demorou muito para responder." : (error instanceof Error ? error.message : "Network request failed");
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    // 401 (Unauthorized) or 403 (Forbidden) usually mean session issues
    // If data is null, it's a raw security rejection, so we must re-auth
    if (res.status === 401 || res.status === 403) {
      if (isDev) {
        console.warn(`[api] Security Rejection (${res.status}):`, {
          url,
          message: data?.message || "Request failed",
          error: data?.error,
          details: data,
          token: tokenStore.get()?.substring(0, 15) + "..."
        });
      }
      // Redirect automatically to login
      tokenStore.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const msg = getMessageFromResponse(data) || `Request failed (${res.status})`;
    if (isDev) {
      console.error("[api] request failed", {
        method,
        url,
        status: res.status,
        message: msg,
        data,
      });
    }
    throw new ApiError(String(msg), res.status);
  }
  return data;
}

export function getErrorMessage(error, fallback) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

function getMessageFromResponse(data) {
  if (!data || typeof data !== "object") return null;
  if (!("message" in data)) return null;
  const message = data.message;
  return typeof message === "string" ? message : null;
}

function redactHeaders(headers) {
  return Array.from(headers.entries()).reduce((acc, [key, value]) => {
    acc[key] = key.toLowerCase() === "authorization" ? "[redacted]" : value;
    return acc;
  }, {});
}

function previewBody(body) {
  if (typeof body === "string") return body;
  if (body == null) return null;
  if (body instanceof FormData) return "[form-data]";
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof Blob) return `[blob:${body.type || "unknown"}]`;
  return `[${body.constructor.name}]`;
}

export const formatCurrency = (n, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n ?? 0);
