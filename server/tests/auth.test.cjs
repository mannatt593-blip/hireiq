const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const authRoutes = require("../routes/authRoutes");

const secret = "test-only-secret-not-for-production";
const user = { id: "9f362200-3b36-4b55-93f8-9abacdc6c871", email: "test@example.com", role: "recruiter" };
let server, base, originalQuery;
const previousSecret = process.env.JWT_SECRET;

before(async () => {
  process.env.JWT_SECRET = secret;
  originalQuery = pool.query;
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.get("/protected", authMiddleware, (req, res) => res.json(req.user));
  server = await new Promise(resolve => { const running = app.listen(0, "127.0.0.1", () => resolve(running)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  pool.query = originalQuery;
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
  await new Promise(resolve => server.close(resolve));
  await pool.end();
});
const request = (authorization, path = "/protected") => fetch(base + path, {
  headers: authorization ? { Authorization: authorization } : {},
});

test("accepts a signed, unexpired session", async () => {
  const response = await request(`Bearer ${jwt.sign(user, secret, { expiresIn: "1h" })}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, user.id);
});

for (const [name, authorization] of [
  ["missing token", undefined],
  ["malformed token", "Bearer garbage"],
  ["expired token", `Bearer ${jwt.sign(user, secret, { expiresIn: -1 })}`],
  ["wrong signature", `Bearer ${jwt.sign(user, "wrong-secret", { expiresIn: "1h" })}`],
  ["missing expiry", `Bearer ${jwt.sign(user, secret)}`],
  ["missing identity", `Bearer ${jwt.sign({}, secret, { expiresIn: "1h" })}`],
  ["invalid identity", `Bearer ${jwt.sign({ ...user, id: "not-a-user-id" }, secret, { expiresIn: "1h" })}`],
  ["wrong algorithm", `Bearer ${jwt.sign(user, secret, { expiresIn: "1h", algorithm: "HS384" })}`],
  ["trailing header data", `Bearer ${jwt.sign(user, secret, { expiresIn: "1h" })} extra`],
  ["not yet valid", `Bearer ${jwt.sign(user, secret, { expiresIn: "1h", notBefore: "1h" })}`],
]) {
  test(`rejects ${name} with 401`, async () => {
    assert.equal((await request(authorization)).status, 401);
  });
}

test("accepts the case-insensitive Bearer scheme", async () => {
  assert.equal((await request(`bearer ${jwt.sign(user, secret, { expiresIn: "1h" })}`)).status, 200);
});
test("a deleted user is an invalid session", async () => {
  pool.query = async (_sql, params) => { assert.deepEqual(params, [user.id]); return { rows: [] }; };
  const response = await request(`Bearer ${jwt.sign(user, secret, { expiresIn: "1h" })}`, "/api/auth/me");
  assert.equal(response.status, 401);
});
test("current user comes from the database", async () => {
  pool.query = async (_sql, params) => { assert.deepEqual(params, [user.id]); return { rows: [{ ...user, name: "Current name" }] }; };
  const response = await request(`Bearer ${jwt.sign(user, secret, { expiresIn: "1h" })}`, "/api/auth/me");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.name, "Current name");
});
test("database outages are not authentication failures", async () => {
  pool.query = async () => { throw new Error("database offline"); };
  assert.equal((await request(`Bearer ${jwt.sign(user, secret, { expiresIn: "1h" })}`, "/api/auth/me")).status, 500);
});
