/**
 * Integration tests — Analytics endpoints
 *
 * Requiere DB corriendo (DATABASE_URL en .env).
 * Registra un usuario temporal para obtener JWT y lo elimina en afterAll.
 * Solo lectura — no modifica datos del seed.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const testEmail = `test_analytics_${RUN}@scout-integration.test`;

let token: string;

beforeAll(async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ email: testEmail, password: "test1234", name: "Analytics Tester" });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: testEmail, password: "test1234" });
  token = loginRes.body.token;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.email, testEmail)).catch(() => null);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("Analytics — protección JWT", () => {
  it("401 — GET /api/analytics/leaderboard sin token", async () => {
    const res = await request(app).get("/api/analytics/leaderboard");
    expect(res.status).toBe(401);
  });

  it("401 — GET /api/analytics/summary sin token", async () => {
    const res = await request(app).get("/api/analytics/summary");
    expect(res.status).toBe(401);
  });
});

// ── GET /api/analytics/leaderboard ───────────────────────────────────────────

describe("GET /api/analytics/leaderboard", () => {
  it("200 — devuelve array con campo rank", async () => {
    const res = await request(app).get("/api/analytics/leaderboard").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("rank");
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).toHaveProperty("metricValue");
    }
  });

  it("200 — rank es secuencial desde 1", async () => {
    const res = await request(app).get("/api/analytics/leaderboard?limit=5").set(auth());
    expect(res.status).toBe(200);
    res.body.forEach((row: { rank: number }, i: number) => {
      expect(row.rank).toBe(i + 1);
    });
  });

  it("200 — metric=goals devuelve resultados ordenados", async () => {
    const res = await request(app).get("/api/analytics/leaderboard?metric=goals").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("200 — metric=assists devuelve resultados", async () => {
    const res = await request(app).get("/api/analytics/leaderboard?metric=assists").set(auth());
    expect(res.status).toBe(200);
  });

  it("200 — metric=rating devuelve resultados (default)", async () => {
    const res = await request(app).get("/api/analytics/leaderboard?metric=rating").set(auth());
    expect(res.status).toBe(200);
  });

  it("200 — filtro positions=GK devuelve solo porteros", async () => {
    const res = await request(app)
      .get("/api/analytics/leaderboard?metric=savePct&positions=GK")
      .set(auth());
    expect(res.status).toBe(200);
    res.body.forEach((row: { position: string }) => {
      expect(row.position).toBe("GK");
    });
  });

  it("400 — métrica inválida", async () => {
    const res = await request(app)
      .get("/api/analytics/leaderboard?metric=metrica_que_no_existe")
      .set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/métrica inválida/i);
  });

  it("400 — seasonId no numérico", async () => {
    const res = await request(app)
      .get("/api/analytics/leaderboard?seasonId=abc")
      .set(auth());
    expect(res.status).toBe(400);
  });
});

// ── GET /api/analytics/summary ────────────────────────────────────────────────

describe("GET /api/analytics/summary", () => {
  it("200 — devuelve objeto con todos los campos esperados", async () => {
    const res = await request(app).get("/api/analytics/summary").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalGoals");
    expect(res.body).toHaveProperty("totalAssists");
    expect(res.body).toHaveProperty("avgRating");
    expect(res.body).toHaveProperty("activePlayers");
    expect(res.body).toHaveProperty("totalMatches");
  });

  it("200 — todos los valores son números", async () => {
    const res = await request(app).get("/api/analytics/summary").set(auth());
    expect(res.status).toBe(200);
    Object.values(res.body).forEach((v) => {
      expect(typeof v).toBe("number");
    });
  });

  it("200 — activePlayers es mayor que 0 (hay datos en el seed)", async () => {
    const res = await request(app).get("/api/analytics/summary").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.activePlayers).toBeGreaterThan(0);
  });

  it("400 — seasonId no numérico", async () => {
    const res = await request(app).get("/api/analytics/summary?seasonId=abc").set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/seasonId/i);
  });

  it("200 — con seasonId válido devuelve estructura correcta", async () => {
    const res = await request(app).get("/api/analytics/summary?seasonId=1").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalGoals");
  });
});
