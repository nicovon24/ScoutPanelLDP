/**
 * Integration tests — Players endpoints
 *
 * Requiere DB corriendo (DATABASE_URL en .env).
 * Registra un usuario temporal para obtener JWT y lo elimina en afterAll.
 * No inserta ni borra jugadores — usa los del seed.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { users, players } from "../../db/schema";
import { eq } from "drizzle-orm";

const RUN = Date.now();
const testEmail = `test_players_${RUN}@scout-integration.test`;

let token: string;
let firstPlayerId: number;

beforeAll(async () => {
  // Registrar usuario para obtener token
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: testEmail, password: "test1234", name: "Players Tester" });
  token = res.body.token;

  // Obtener un ID de jugador real del seed
  const player = await db.query.players.findFirst();
  firstPlayerId = player!.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.email, testEmail)).catch(() => null);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// ── Auth guard ────────────────────────────────────────────────────────────────

describe("Players — protección JWT", () => {
  it("401 — GET /api/players sin token", async () => {
    const res = await request(app).get("/api/players");
    expect(res.status).toBe(401);
  });

  it("401 — GET /api/players/:id sin token", async () => {
    const res = await request(app).get(`/api/players/${firstPlayerId}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/players ──────────────────────────────────────────────────────────

describe("GET /api/players", () => {
  it("200 — devuelve { items, totalItems }", async () => {
    const res = await request(app).get("/api/players").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("totalItems");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.totalItems).toBe("number");
  });

  it("200 — paginación: limit=5 devuelve máximo 5 items", async () => {
    const res = await request(app).get("/api/players?limit=5&page=1").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
  });

  it("200 — filtro por posición GK", async () => {
    const res = await request(app).get("/api/players?position=GK").set(auth());
    expect(res.status).toBe(200);
    res.body.items.forEach((p: { position: string }) => {
      expect(p.position).toBe("GK");
    });
  });

  it("200 — búsqueda por nombre devuelve array (puede ser vacío)", async () => {
    const res = await request(app).get("/api/players?q=zzznombreimposible").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it("200 — cada item tiene campos requeridos", async () => {
    const res = await request(app).get("/api/players?limit=1").set(auth());
    expect(res.status).toBe(200);
    if (res.body.items.length > 0) {
      const p = res.body.items[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("position");
    }
  });
});

// ── GET /api/players/nationalities ───────────────────────────────────────────

describe("GET /api/players/nationalities", () => {
  it("200 — devuelve array de strings", async () => {
    const res = await request(app).get("/api/players/nationalities").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(typeof res.body[0]).toBe("string");
    }
  });
});

// ── GET /api/players/search ───────────────────────────────────────────────────

describe("GET /api/players/search", () => {
  it("200 — q vacío devuelve { players, teams } con hasta 20 jugadores", async () => {
    const res = await request(app).get("/api/players/search?q=").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("players");
    expect(res.body).toHaveProperty("teams");
    expect(res.body.players.length).toBeLessThanOrEqual(20);
  });

  it("200 — q con 1 carácter devuelve listas vacías", async () => {
    const res = await request(app).get("/api/players/search?q=a").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.players).toHaveLength(0);
    expect(res.body.teams).toHaveLength(0);
  });

  it("200 — q con 2+ caracteres devuelve estructura correcta", async () => {
    const res = await request(app).get("/api/players/search?q=ar").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.players)).toBe(true);
    expect(Array.isArray(res.body.teams)).toBe(true);
  });
});

// ── GET /api/players/compare ──────────────────────────────────────────────────

describe("GET /api/players/compare", () => {
  it("400 — sin ids devuelve error", async () => {
    const res = await request(app).get("/api/players/compare").set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ids/i);
  });

  it("400 — ids todos inválidos (NaN)", async () => {
    const res = await request(app).get("/api/players/compare?ids=abc,xyz").set(auth());
    expect(res.status).toBe(400);
  });

  it("200 — ids válidos devuelve array", async () => {
    const res = await request(app)
      .get(`/api/players/compare?ids=${firstPlayerId}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/players/:id ──────────────────────────────────────────────────────

describe("GET /api/players/:id", () => {
  it("200 — jugador existente devuelve datos completos", async () => {
    const res = await request(app).get(`/api/players/${firstPlayerId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", firstPlayerId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("position");
    expect(res.body).toHaveProperty("stats");
    expect(res.body).toHaveProperty("ratings");
    expect(res.body).toHaveProperty("injuries");
  });

  it("404 — ID que no existe", async () => {
    const res = await request(app).get("/api/players/9999999").set(auth());
    expect(res.status).toBe(404);
  });

  it("400 — ID no numérico", async () => {
    const res = await request(app).get("/api/players/abc").set(auth());
    expect(res.status).toBe(400);
  });
});
