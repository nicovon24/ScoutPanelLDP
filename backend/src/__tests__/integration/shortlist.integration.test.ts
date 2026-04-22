/**
 * Integration tests — Shortlist endpoints
 *
 * Requiere DB corriendo (DATABASE_URL en .env).
 * Registra un usuario temporal, ejecuta los tests y limpia usuario + entradas
 * de shortlist en afterAll. No toca jugadores del seed.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { users, shortlistEntries, players } from "../../db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const testEmail = `test_shortlist_${RUN}@scout-integration.test`;

let token: string;
let userId: number;
let firstPlayerId: number;
let secondPlayerId: number;

beforeAll(async () => {
  const regRes = await request(app)
    .post("/api/auth/register")
    .send({ email: testEmail, password: "test1234", name: "Shortlist Tester" });
  userId = regRes.body.user.id;
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: testEmail, password: "test1234" });
  token = loginRes.body.token;

  // Obtener dos jugadores reales del seed para los tests
  const allPlayers = await db.select({ id: players.id }).from(players).limit(2);
  firstPlayerId  = allPlayers[0].id;
  secondPlayerId = allPlayers[1].id;
});

afterAll(async () => {
  await db.delete(shortlistEntries).where(eq(shortlistEntries.userId, userId)).catch(() => null);
  await db.delete(users).where(eq(users.email, testEmail)).catch(() => null);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("Shortlist — protección JWT", () => {
  it("401 — GET /api/shortlist sin token", async () => {
    const res = await request(app).get("/api/shortlist");
    expect(res.status).toBe(401);
  });

  it("401 — GET /api/shortlist/ids sin token", async () => {
    const res = await request(app).get("/api/shortlist/ids");
    expect(res.status).toBe(401);
  });

  it("401 — POST /api/shortlist/:id sin token", async () => {
    const res = await request(app).post(`/api/shortlist/${firstPlayerId}`);
    expect(res.status).toBe(401);
  });

  it("401 — DELETE /api/shortlist/:id sin token", async () => {
    const res = await request(app).delete(`/api/shortlist/${firstPlayerId}`);
    expect(res.status).toBe(401);
  });
});

// ── GET — shortlist vacía ─────────────────────────────────────────────────────

describe("GET /api/shortlist (lista vacía)", () => {
  it("200 — usuario nuevo tiene shortlist vacía", async () => {
    const res = await request(app).get("/api/shortlist").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 — /ids devuelve array vacío para usuario nuevo", async () => {
    const res = await request(app).get("/api/shortlist/ids").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── POST — agregar a shortlist ────────────────────────────────────────────────

describe("POST /api/shortlist/:playerId", () => {
  it("201 — agrega jugador existente", async () => {
    const res = await request(app).post(`/api/shortlist/${firstPlayerId}`).set(auth());
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it("201 — idempotente: agregar el mismo jugador dos veces no duplica", async () => {
    await request(app).post(`/api/shortlist/${firstPlayerId}`).set(auth());
    const check = await request(app).get("/api/shortlist/ids").set(auth());
    expect(check.body.filter((id: number) => id === firstPlayerId)).toHaveLength(1);
  });

  it("201 — agrega un segundo jugador", async () => {
    const res = await request(app).post(`/api/shortlist/${secondPlayerId}`).set(auth());
    expect(res.status).toBe(201);
  });

  it("400 — playerId no numérico", async () => {
    const res = await request(app).post("/api/shortlist/abc").set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválido/i);
  });

  it("404 — jugador que no existe", async () => {
    const res = await request(app).post("/api/shortlist/9999999").set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/jugador/i);
  });
});

// ── GET — shortlist con datos ─────────────────────────────────────────────────

describe("GET /api/shortlist (con jugadores)", () => {
  it("200 — devuelve los jugadores agregados", async () => {
    const res = await request(app).get("/api/shortlist").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const ids = res.body.map((p: { id: number }) => p.id);
    expect(ids).toContain(firstPlayerId);
    expect(ids).toContain(secondPlayerId);
  });

  it("200 — cada entrada tiene addedAt", async () => {
    const res = await request(app).get("/api/shortlist").set(auth());
    res.body.forEach((p: { addedAt: unknown }) => {
      expect(p.addedAt).toBeTruthy();
    });
  });

  it("200 — /ids devuelve los IDs correctos", async () => {
    const res = await request(app).get("/api/shortlist/ids").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toContain(firstPlayerId);
    expect(res.body).toContain(secondPlayerId);
  });
});

// ── DELETE — quitar de shortlist ──────────────────────────────────────────────

describe("DELETE /api/shortlist/:playerId", () => {
  it("200 — elimina jugador de la shortlist", async () => {
    const res = await request(app).delete(`/api/shortlist/${firstPlayerId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("200 — el jugador ya no aparece en /ids", async () => {
    const res = await request(app).get("/api/shortlist/ids").set(auth());
    expect(res.body).not.toContain(firstPlayerId);
  });

  it("404 — eliminar jugador que no estaba en la lista", async () => {
    const res = await request(app).delete(`/api/shortlist/${firstPlayerId}`).set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no estaba/i);
  });

  it("400 — playerId no numérico", async () => {
    const res = await request(app).delete("/api/shortlist/abc").set(auth());
    expect(res.status).toBe(400);
  });
});
