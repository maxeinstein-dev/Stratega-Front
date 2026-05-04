const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

const TOKEN_KEY = "stratega.token";
const USER_KEY = "stratega.user";

export type StoredUser = { id: string; name: string; email: string };

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: (): StoredUser | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
  set: (u: StoredUser) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { auth?: boolean; userId?: string } = {}
): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(
      "API base URL not configured. Set VITE_API_BASE_URL in your environment.",
      0
    );
  }
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (opts.auth !== false) {
    const token = tokenStore.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (opts.userId) headers.set("X-User-Id", opts.userId);

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data && (data as any).message) ||
      `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status);
  }
  return data as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

export const formatCurrency = (n: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n ?? 0);
