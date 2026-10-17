// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { API_URL, apiFetch } from "./api";
import { clearSession, getAuthToken, getTokenClaims, saveSession } from "./auth";

const id = "9f362200-3b36-4b55-93f8-9abacdc6c871";
const token = (claims = {}) => [
  btoa(JSON.stringify({ alg: "HS256" })),
  btoa(JSON.stringify({ id, exp: Math.floor(Date.now() / 1000) + 3600, ...claims })),
  "signature",
].map(part => part.replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_")).join(".");

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
});
afterEach(() => vi.unstubAllGlobals());

test("login uses only the canonical localStorage token and removes legacy sessions", () => {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ["hireiq_token", "hireiqToken", "token", "hireiq_user"]) storage.setItem(key, "old");
    storage.setItem("hireiq_settings", "keep");
  }
  const saved = token();
  saveSession(saved, { id });
  expect(getAuthToken()).toBe(saved);
  expect(JSON.parse(localStorage.getItem("hireiq_user"))).toEqual({ id });
  for (const storage of [localStorage, sessionStorage]) {
    expect(storage.getItem("hireiqToken")).toBeNull();
    expect(storage.getItem("token")).toBeNull();
    expect(storage.getItem("hireiq_settings")).toBe("keep");
  }
  expect(sessionStorage.getItem("hireiq_token")).toBeNull();
  expect(sessionStorage.getItem("hireiq_user")).toBeNull();
  clearSession();
  expect(getAuthToken()).toBeNull();
  expect(localStorage.getItem("hireiq_user")).toBeNull();
});

test.each([null, "garbage", "null", "undefined", token({ exp: 0 }), token({ exp: "9999999999" }), token({ exp: undefined }), token({ id: null }), token({ nbf: "tomorrow" })])(
  "rejects unusable session %s", value => expect(getTokenClaims(value)).toBeNull()
);

test("API requests use the current token and preserve FormData and custom headers", async () => {
  const saved = token(); saveSession(saved);
  const body = new FormData(); body.append("resume", "data");
  await apiFetch(`${API_URL}/resumes/upload`, {
    method: "POST", body, headers: { Authorization: "Bearer stale", "X-Test": "preserved" },
  });
  const [, options] = fetch.mock.calls[0];
  expect(options.headers.get("Authorization")).toBe(`Bearer ${saved}`);
  expect(options.headers.get("X-Test")).toBe("preserved");
  expect(options.headers.has("Content-Type")).toBe(false);
  expect(options.body).toBe(body);
  expect(options.method).toBe("POST");
});

test("expired tokens are cleared before making a request", async () => {
  localStorage.setItem("hireiq_token", token({ exp: 1 }));
  await expect(apiFetch(`${API_URL}/jobs`)).rejects.toThrow(/sign in/i);
  expect(fetch).not.toHaveBeenCalled();
  expect(getAuthToken()).toBeNull();
});

test.each([403, 404, 500])("HTTP %s does not clear the session", async status => {
  const saved = token(); saveSession(saved);
  fetch.mockResolvedValueOnce(new Response("{}", { status }));
  expect((await apiFetch(`${API_URL}/jobs`)).status).toBe(status);
  expect(getAuthToken()).toBe(saved);
});

test("network failure does not clear the session", async () => {
  const saved = token(); saveSession(saved);
  fetch.mockRejectedValueOnce(new TypeError("offline"));
  await expect(apiFetch(`${API_URL}/jobs`)).rejects.toThrow("offline");
  expect(getAuthToken()).toBe(saved);
});

test("a delayed 401 from an old session cannot log out a new session", async () => {
  saveSession(token());
  let resolve;
  fetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const oldRequest = apiFetch(`${API_URL}/jobs`);
  const newer = token({ exp: Math.floor(Date.now() / 1000) + 7200 });
  saveSession(newer);
  resolve(new Response("{}", { status: 401 }));
  await expect(oldRequest).rejects.toThrow(/sign in/i);
  expect(getAuthToken()).toBe(newer);
});

test("credentials are never sent to a different origin or API path", async () => {
  saveSession(token());
  for (const url of ["https://example.com/api/jobs", "http://localhost:5000/api-other/jobs"]) {
    await expect(apiFetch(url)).rejects.toThrow(/HireIQ API/);
  }
  expect(fetch).not.toHaveBeenCalled();
});
