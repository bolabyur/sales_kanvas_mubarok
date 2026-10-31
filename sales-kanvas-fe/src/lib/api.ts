const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:53103/api";
const ACCESS_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY ?? "sk_access_token";
const REFRESH_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY ?? "sk_refresh_token";

const REFRESH_PATH = "/auth/refresh";
const REFRESH_LOCK = "sk-auth-refresh";
const NO_REFRESH = new Set(["/auth/login", REFRESH_PATH]);

export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
  statusCode: number;
};

type TokenPair = { access_token: string; refresh_token: string };

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown;
  readonly details?: string;

  constructor(message: string, status: number, errors?: unknown, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.details = details;
  }
}

export const tokens = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

function send(path: string, init: RequestInit, access: string | null) {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (init.method?.toUpperCase() === "POST" && !headers.has("x-idempotency-key")) {
    headers.set("x-idempotency-key", crypto.randomUUID());
  }

  if (access) headers.set("Authorization", `Bearer ${access}`);
  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const access = tokens.access();
  let res = await send(path, init, access);

  if (res.status === 401 && access && !NO_REFRESH.has(path)) {
    if (await refreshOnce(access)) {
      res = await send(path, init, tokens.access());
    }
  }

  const body: { message?: string; errors?: unknown; details?: string } | null = await res
    .json()
    .catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      body?.message ?? res.statusText,
      res.status,
      body?.errors,
      body?.details
    );
  }
  return (body as ApiResponse<T>).data;
}

let refreshing: Promise<boolean> | null = null;

function refreshOnce(staleAccess: string): Promise<boolean> {
  refreshing ??= withLock(() => doRefresh(staleAccess)).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  return navigator.locks ? navigator.locks.request(REFRESH_LOCK, fn) : fn();
}

async function doRefresh(staleAccess: string): Promise<boolean> {
  if (tokens.access() !== staleAccess) return tokens.access() !== null;
  const refresh = tokens.refresh();
  if (!refresh) return false;

  const res = await send(REFRESH_PATH, { method: "POST", body: JSON.stringify({ refresh_token: refresh }) }, null);

  if (!res.ok) {
    if (res.status === 401) tokens.clear();
    return false;
  }

  const { data } = (await res.json()) as ApiResponse<TokenPair>;
  tokens.set(data.access_token, data.refresh_token);
  return true;
}