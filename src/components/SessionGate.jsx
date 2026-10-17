import { useEffect, useState, useSyncExternalStore } from "react";
import { API_URL, apiFetch } from "../services/api";
import { clearSession, getAuthToken, getTokenClaims, subscribeSession } from "../services/auth";

export default function SessionGate({ children }) {
  const token = useSyncExternalStore(subscribeSession, getAuthToken, () => null);
  // Remount validation on every token transition, including logout then login.
  return <SessionValidator key={token || "signed-out"} token={token}>{children}</SessionValidator>;
}

function SessionValidator({ token, children }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const claims = getTokenClaims(token);
    if (!claims) {
      clearSession();
      return () => controller.abort();
    }

    // Recheck on focus too: browsers can pause timers in background tabs.
    const checkExpiry = () => {
      if (getAuthToken() === token && !getTokenClaims(token)) clearSession();
    };
    const timer = setTimeout(checkExpiry, Math.min(claims.exp * 1000 - Date.now(), 2147483647));
    window.addEventListener("focus", checkExpiry);

    const validate = async () => {
      try {
        const response = await apiFetch(`${API_URL}/auth/me`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to verify your session");
        const data = await response.json();
        if (!data.success || data.user?.id !== claims.id) throw new Error("Unable to verify your session");
        if (active && getAuthToken() === token) {
          localStorage.setItem("hireiq_user", JSON.stringify(data.user));
          setResult({ token, attempt, status: "authenticated" });
        }
      } catch (error) {
        if (active && error.name !== "AbortError" && getAuthToken() === token) {
          setResult({ token, attempt, status: "error" });
        }
      }
    };
    validate();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", checkExpiry);
    };
  }, [token, attempt]);

  if (!token) return children(false);
  if (result?.token !== token || result?.attempt !== attempt) {
    return <p role="status">Checking your session…</p>;
  }
  if (result.status === "error") {
    return (
      <div role="alert">
        <p>Unable to verify your session. Check your connection and try again.</p>
        <button onClick={() => setAttempt(value => value + 1)}>Retry</button>
        <button onClick={clearSession}>Sign out</button>
      </div>
    );
  }
  return children(true);
}
