import { clearSession, getAuthToken, getTokenClaims } from "./auth";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

// Use only for protected API calls; login has its own error handling.
export async function apiFetch(url, options = {}) {
  const target = new URL(url, window.location.origin);
  const base = new URL(API_URL, window.location.origin);
  if (target.origin !== base.origin || !target.pathname.startsWith(`${base.pathname}/`)) {
    throw new Error("Authenticated requests must target the HireIQ API");
  }

  const token = getAuthToken();
  if (!getTokenClaims(token)) {
    clearSession();
    throw new Error("Your session has expired. Please sign in again.");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    // A late response from an old request must not erase a newer login.
    if (getAuthToken() === token) clearSession();
    throw new Error("Your session has expired. Please sign in again.");
  }
  return response;
}
