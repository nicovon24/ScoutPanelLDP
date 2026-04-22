/**
 * Integration tests — Auth endpoints
 *
 * Usa la DB real definida en DATABASE_URL (.env).
 * Cada suite crea usuarios con emails únicos (timestamp) y los elimina en afterAll.
 * No necesita DB de test separada: limpia su propio estado.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const email = (tag: string) => `test_${tag}_${RUN}@scout-integration.test`;

// Emails creados durante los tests — se borran en afterAll
const CREATED_EMAILS: string[] = [];

/** `set-cookie` en Node puede ser `string` o `string[]` según el stack de tipos. */
function setCookieList(headers: { "set-cookie"?: string | string[] }): string[] {
  const raw = headers["set-cookie"];
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

afterAll(async () => {
  for (const e of CREATED_EMAILS) {
    await db.delete(users).where(eq(users.email, e)).catch(() => null);
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("201 — crea un usuario nuevo sin sesión (ok + user, sin token ni cookie)", async () => {
    const mail = email("register_ok");
    CREATED_EMAILS.push(mail);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "test1234", name: "Test Scout" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body).not.toHaveProperty("token");
    expect(res.body.user).toMatchObject({ email: mail, name: "Test Scout" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    const cookies = setCookieList(res.headers);
    expect(cookies.find((c) => c.startsWith("refreshToken="))).toBeUndefined();
  });

  it("409 — email duplicado", async () => {
    const mail = email("register_dup");
    CREATED_EMAILS.push(mail);

    await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "test1234", name: "Scout A" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "otrapass", name: "Scout B" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/registrado/i);
  });

  it("400 — email inválido", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "no-es-email", password: "test1234", name: "X" });

    expect(res.status).toBe(400);
  });

  it("400 — password menor a 6 caracteres", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: email("short_pass"), password: "123", name: "X" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6/);
  });

  it("400 — nombre vacío", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: email("no_name"), password: "test1234", name: "" });

    expect(res.status).toBe(400);
  });

  it("400 — body vacío", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  const loginEmail = email("login_suite");
  const loginPass  = "loginpass1";

  beforeAll(async () => {
    CREATED_EMAILS.push(loginEmail);
    await request(app)
      .post("/api/auth/register")
      .send({ email: loginEmail, password: loginPass, name: "Login Scout" });
  });

  it("200 — credenciales correctas devuelven token + user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: loginEmail, password: loginPass });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(loginEmail);
  });

  it("401 — password incorrecto", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: loginEmail, password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  it("401 — email no registrado", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.test", password: "test1234" });

    expect(res.status).toBe(401);
  });

  it("400 — password vacío", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: loginEmail, password: "" });

    expect(res.status).toBe(400);
  });

  it("normaliza el email — login con uppercase funciona", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: loginEmail.toUpperCase(), password: loginPass });

    expect(res.status).toBe(200);
  });
});

// ── Cookie refreshToken en login / register ───────────────────────────────────

describe("Cookie refreshToken — login y register", () => {
  it("register no setea cookie refreshToken (sin sesión)", async () => {
    const mail = email("cookie_register");
    CREATED_EMAILS.push(mail);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "test1234", name: "Cookie Scout" });

    expect(res.status).toBe(201);
    const cookies = setCookieList(res.headers);
    expect(cookies.find((c: string) => c.startsWith("refreshToken="))).toBeUndefined();
  });

  it("login setea la cookie refreshToken httpOnly", async () => {
    const mail = email("cookie_login");
    CREATED_EMAILS.push(mail);
    await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "test1234", name: "Cookie Scout 2" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: mail, password: "test1234" });

    expect(res.status).toBe(200);
    const cookies = setCookieList(res.headers);
    const refreshCookie = cookies.find((c: string) => c.startsWith("refreshToken="));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

describe("POST /api/auth/refresh", () => {
  let refreshCookieHeader: string;
  const refreshEmail = email("refresh_suite");

  beforeAll(async () => {
    CREATED_EMAILS.push(refreshEmail);
    await request(app)
      .post("/api/auth/register")
      .send({ email: refreshEmail, password: "refreshpass1", name: "Refresh Scout" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: refreshEmail, password: "refreshpass1" });
    const cookies = setCookieList(loginRes.headers);
    refreshCookieHeader = cookies.find((c: string) => c.startsWith("refreshToken=")) ?? "";
  });

  it("200 — cookie válida devuelve nuevo access token + user", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookieHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(refreshEmail);
  });

  it("el nuevo access token da acceso a rutas protegidas", async () => {
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookieHeader);

    const newToken = refreshRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${newToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(refreshEmail);
  });

  it("401 — sin cookie de refresh", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/sesión/i);
  });

  it("401 — cookie con token adulterado", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=token.falso.invalido");

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("200 — borra la cookie refreshToken", async () => {
    const mail = email("logout_suite");
    CREATED_EMAILS.push(mail);
    await request(app)
      .post("/api/auth/register")
      .send({ email: mail, password: "logoutpass1", name: "Logout Scout" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mail, password: "logoutpass1" });
    const cookies = setCookieList(loginRes.headers);
    const cookieHeader = cookies.find((c: string) => c.startsWith("refreshToken=")) ?? "";

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // La cookie borrada debe venir con Max-Age=0 o expires en el pasado
    const setCookies = setCookieList(res.headers);
    const clearedCookie = setCookies.find((c: string) => c.startsWith("refreshToken="));
    expect(clearedCookie).toBeDefined();
    expect(clearedCookie).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
  });

  it("200 — logout sin cookie también responde ok (idempotente)", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  let validToken: string;
  const meEmail = email("me_suite");

  beforeAll(async () => {
    CREATED_EMAILS.push(meEmail);
    await request(app)
      .post("/api/auth/register")
      .send({ email: meEmail, password: "mepass123", name: "Me Scout" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: meEmail, password: "mepass123" });
    validToken = loginRes.body.token;
  });

  it("200 — token válido devuelve datos del usuario", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(meEmail);
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("401 — sin header Authorization", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("401 — token adulterado", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.falso.invalido");

    expect(res.status).toBe(401);
  });

  it("401 — formato Bearer incorrecto (sin prefijo)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", validToken);

    expect(res.status).toBe(401);
  });
});
