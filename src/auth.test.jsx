// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { clearSession, saveSession } from "./services/auth";

const user = { id: "9f362200-3b36-4b55-93f8-9abacdc6c871", name: "Test User", email: "test@example.com", role: "recruiter" };
const token = (claims = {}) => [
  btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  btoa(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 3600, ...claims })),
  "test-signature",
].map(part => part.replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_")).join(".");
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/settings");
  vi.stubGlobal("fetch", vi.fn(async () => json({ success: false }, 401)));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test.each(["garbage", token({ exp: 1 }), token({ exp: undefined }), token({ nbf: 9999999999 })])(
  "invalid or expired saved token %s returns to login and is removed", async saved => {
    localStorage.setItem("hireiq_token", saved);
    localStorage.setItem("hireiq_user", JSON.stringify(user));
    render(<App />);
    await screen.findByRole("button", { name: "Sign in" });
    expect(localStorage.getItem("hireiq_token")).toBeNull();
    expect(localStorage.getItem("hireiq_user")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  }
);

test("a well-formed token rejected by the server cannot mount the protected app", async () => {
  localStorage.setItem("hireiq_token", token());
  render(<App />);
  await screen.findByRole("button", { name: "Sign in" });
  expect(fetch.mock.calls[0][0]).toMatch(/\/auth\/me$/);
  expect(localStorage.getItem("hireiq_token")).toBeNull();
});

test("protected content waits for server validation", async () => {
  localStorage.setItem("hireiq_token", token());
  let resolve;
  fetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  fetch.mockImplementation(async () => json({ success: true, notifications: [] }));
  render(<App />);
  expect(screen.queryByText("Settings", { selector: "h1" })).toBeNull();
  await waitFor(() => expect(resolve).toBeTypeOf("function"));
  resolve(json({ success: true, user }));
  await screen.findByText("Settings", { selector: "h1" });
});

test("a temporary validation outage retains the token and allows retry", async () => {
  const saved = token();
  localStorage.setItem("hireiq_token", saved);
  fetch.mockRejectedValueOnce(new TypeError("Network unavailable"));
  render(<App />);
  const retry = await screen.findByRole("button", { name: /retry/i });
  expect(localStorage.getItem("hireiq_token")).toBe(saved);
  fetch.mockImplementation(async () => json({ success: true, user, notifications: [] }));
  fireEvent.click(retry);
  await screen.findByText("Settings", { selector: "h1" });
});

test("a protected API 401 logs out and clears legacy credentials in both stores", async () => {
  localStorage.setItem("hireiq_token", token());
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem("hireiqToken", "old-token");
    storage.setItem("token", "old-token");
    storage.setItem("hireiq_user", JSON.stringify(user));
  }
  fetch.mockImplementationOnce(async () => json({ success: true, user }));
  render(<App />);
  await screen.findByRole("button", { name: "Sign in" });
  expect(window.location.pathname).toBe("/login");
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ["hireiq_token", "hireiqToken", "token", "hireiq_user"]) {
      expect(storage.getItem(key)).toBeNull();
    }
  }
});

test("login 401 stays on the form and shows the server error", async () => {
  window.history.replaceState({}, "", "/login");
  fetch.mockImplementation(async () => json({ message: "Invalid email or password" }, 401));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText("Invalid email or password");
  expect(window.location.pathname).toBe("/login");
});

test("logging in with the same token after logout still requires server validation", async () => {
  const saved = token();
  localStorage.setItem("hireiq_token", saved);
  fetch.mockImplementation(async () => json({ success: true, user, notifications: [] }));
  render(<App />);
  await screen.findByText("Settings", { selector: "h1" });
  act(() => clearSession());
  await screen.findByRole("button", { name: "Sign in" });
  fetch.mockImplementation(() => new Promise(() => {}));
  act(() => saveSession(saved, user));
  expect(screen.getByRole("status").textContent).toMatch(/checking/i);
  expect(window.location.pathname).toBe("/login");
});

test("a session expiring while the app is open automatically returns to login", async () => {
  localStorage.setItem("hireiq_token", token({ exp: Math.floor(Date.now() / 1000) + 10 }));
  fetch.mockImplementation(async () => json({ success: true, user, notifications: [] }));
  vi.useFakeTimers();
  render(<App />);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(screen.getByText("Settings", { selector: "h1" })).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(11000); });
  expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  expect(localStorage.getItem("hireiq_token")).toBeNull();
});

test("logout from another tab unmounts protected content", async () => {
  localStorage.setItem("hireiq_token", token());
  fetch.mockImplementation(async () => json({ success: true, user, notifications: [] }));
  render(<App />);
  await screen.findByText("Settings", { selector: "h1" });
  act(() => {
    localStorage.removeItem("hireiq_token");
    window.dispatchEvent(new StorageEvent("storage", { key: "hireiq_token", storageArea: localStorage }));
  });
  await screen.findByRole("button", { name: "Sign in" });
  expect(screen.queryByText("Settings", { selector: "h1" })).toBeNull();
});

test("successful login saves a canonical token and verifies it before entering the app", async () => {
  window.history.replaceState({}, "", "/login");
  const saved = token();
  let finishValidation;
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith("/auth/login")) {
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ email: "alex@hireiq.com", password: "12345678" });
      return json({ success: true, token: saved, user });
    }
    if (url.endsWith("/auth/me")) {
      expect(options.headers.get("Authorization")).toBe(`Bearer ${saved}`);
      return new Promise(resolve => { finishValidation = resolve; });
    }
    return json({ success: true, notifications: [], interviews: [] });
  });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(finishValidation).toBeTypeOf("function"));
  expect(screen.getByRole("status").textContent).toMatch(/checking/i);
  expect(localStorage.getItem("hireiq_token")).toBe(saved);
  await act(async () => { finishValidation(json({ success: true, user })); });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(window.location.pathname).toBe("/dashboard");
});
