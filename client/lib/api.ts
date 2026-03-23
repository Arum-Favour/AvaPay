import {
  AUTH_ERROR_ACCOUNT_NOT_REGISTERED,
  AUTH_ERROR_ROLE_MISMATCH,
  AUTH_ERROR_ROLE_PROFILE_MISSING,
  EMPLOYER_ERROR_COMPANY_NOT_SETUP,
} from "@shared/api";

export { AUTH_ERROR_ACCOUNT_NOT_REGISTERED };
export { AUTH_ERROR_ROLE_MISMATCH, AUTH_ERROR_ROLE_PROFILE_MISSING };
export { EMPLOYER_ERROR_COMPANY_NOT_SETUP };

/** Thrown by `fetchJson` when the API returns a JSON error body (includes optional `code`). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * When the SPA is hosted separately from the Express API (static CDN, etc.),
 * set `VITE_API_BASE_URL` to the API origin (no trailing slash).
 * For local dev, leave unset so requests stay same-origin as the page; mixing
 * `localhost` in the browser with a LAN IP here breaks CORS/cookies unless
 * server `CORS_ORIGIN` lists every origin you use.
 */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : apiUrl(path);
  const res = await fetch(url, { ...init, credentials: "include" });
  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    if (ct.includes("application/json")) {
      try {
        const j = JSON.parse(text) as { error?: string; code?: string };
        throw new ApiError(j?.error ?? `Request failed (${res.status})`, res.status, j?.code);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new Error(`Request failed (${res.status})`);
      }
    }
    throw new Error(
      `Request failed (${res.status}): API returned HTML instead of JSON. ` +
        `If the frontend is on a different host than the API, set VITE_API_BASE_URL in your build to your backend URL (e.g. https://your-api.onrender.com).`,
    );
  }

  if (!ct.includes("application/json")) {
    throw new Error(
      `Expected JSON from API but received "${ct || "unknown"}". ` +
        `Set VITE_API_BASE_URL if the API is hosted separately.`,
    );
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from API");
  }
}
