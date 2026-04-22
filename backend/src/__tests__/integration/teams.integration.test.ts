/**
 * Integration tests — Teams endpoints
 *
 * Requiere DB corriendo (DATABASE_URL en .env).
 * Registra un usuario temporal para obtener JWT y lo elimina en afterAll.
 * No inserta ni borra equipos — usa los del seed.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { users, teams } from "../../db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const testEmail = `test_teams_${RUN}@scout-integration.test`;

let token: string;
let firstTeamId: number;

beforeAll(async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ email: testEmail, password: "test1234", name: "Teams Tester" });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: testEmail, password: "test1234" });
  token = loginRes.body.token;

  const team = await db.query.teams.findFirst();
  firstTeamId = team!.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.email, testEmail)).catch(() => null);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("Teams — protección JWT", () => {
  it("401 — GET /api/teams sin token", async () => {
    const res = await request(app).get("/api/teams");
    expect(res.status).toBe(401);
  });

  it("401 — GET /api/teams/:id sin token", async () => {
    const res = await request(app).get(`/api/teams/${firstTeamId}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/teams ────────────────────────────────────────────────────────────

describe("GET /api/teams", () => {
  it("200 — devuelve array de equipos", async () => {
    const res = await request(app).get("/api/teams").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("200 — cada equipo tiene id y name", async () => {
    const res = await request(app).get("/api/teams").set(auth());
    expect(res.status).toBe(200);
    res.body.forEach((t: { id: unknown; name: unknown }) => {
      expect(typeof t.id).toBe("number");
      expect(typeof t.name).toBe("string");
    });
  });
});

// ── GET /api/teams/:id ────────────────────────────────────────────────────────

describe("GET /api/teams/:id", () => {
  it("200 — equipo existente devuelve datos + roster", async () => {
    const res = await request(app).get(`/api/teams/${firstTeamId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", firstTeamId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("players");
    expect(Array.isArray(res.body.players)).toBe(true);
  });

  it("200 — cada jugador en el roster tiene campos básicos", async () => {
    const res = await request(app).get(`/api/teams/${firstTeamId}`).set(auth());
    expect(res.status).toBe(200);
    res.body.players.forEach((p: { id: unknown; name: unknown; position: unknown }) => {
      expect(typeof p.id).toBe("number");
      expect(typeof p.name).toBe("string");
      expect(typeof p.position).toBe("string");
    });
  });

  it("404 — ID que no existe", async () => {
    const res = await request(app).get("/api/teams/9999999").set(auth());
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("400 — ID no numérico", async () => {
    const res = await request(app).get("/api/teams/abc").set(auth());
    expect(res.status).toBe(400);
  });
});
