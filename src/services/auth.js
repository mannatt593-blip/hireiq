const TOKEN_KEY = "hireiq_token";
const USER_KEY = "hireiq_user";
const SESSION_EVENT = "hireiq:session-change";
const AUTH_KEYS = [TOKEN_KEY, "hireiqToken", "token", USER_KEY];

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

// This is only a local expiry/shape check. The API verifies the signature.
export function getTokenClaims(token) {
  try {
    if (typeof token !== "string" || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;
    const [headerPart, payloadPart] = token.split(".");
    const decode = part => JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/")));
    const header = decode(headerPart);
    const claims = decode(payloadPart);
    const now = Date.now() / 1000;
    if (header?.alg !== "HS256" || !claims || typeof claims.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.id) ||
        !Number.isFinite(claims.exp) || claims.exp <= now ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now))) return null;
    return claims;
  } catch {
    return null;
  }
}

function removeCredentials() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of AUTH_KEYS) storage.removeItem(key);
  }
}

export function clearSession() {
  removeCredentials();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(token, user) {
  if (!getTokenClaims(token)) throw new Error("Invalid authentication session");
  removeCredentials();
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeSession(callback) {
  const onStorage = event => {
    if (event.storageArea === localStorage && (event.key === TOKEN_KEY || event.key === null)) callback();
  };
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
