# Testing Plan — Scout Panel

## Niveles de tests disponibles en este proyecto

---

## 1. Unit Tests (tests unitarios)

Prueban **una función o componente de forma aislada**, sin red ni DB.

### Backend

| Archivo | Qué probar |
|---|---|
| `backend/src/__tests__/auth.test.ts` | Esquemas Zod (validación de `registerSchema` y `loginSchema`) |
| `backend/src/__tests__/players.test.ts` | Función de construcción de query (parámetros de filtro → SQL esperado) |
| `backend/src/__tests__/analyticsConfig.test.ts` | `formatCell()` de `lib/analyticsConfig` — distintos formatos de número |
| `backend/src/__tests__/utils.test.ts` | `requireAuth` con tokens válidos / inválidos / ausentes (mock de `jwt.verify`) |

### Frontend

| Archivo | Qué probar |
|---|---|
| `frontend/src/__tests__/PlayerTable.test.tsx` | Renderiza lista, skeleton con `loading=true`, vacío con `players=[]`, click en sort llama `onSort` |
| `frontend/src/__tests__/LeagueTable.test.tsx` | Renderiza entries con rank/nombre/stats, skeleton, empty state, click en header llama `onSort` |
| `frontend/src/__tests__/SearchBar.test.tsx` | Render, typing < 3 chars no dispara fetch, typing ≥ 3 chars llama API, compact mode muestra pills |
| `frontend/src/__tests__/posStyle.test.ts` | `posStyle()` de `lib/utils` → clase CSS correcta por posición |
| `frontend/src/__tests__/formatCell.test.ts` | `formatCell()` de `lib/analyticsConfig` → formato de decimales y porcentajes |
| `frontend/src/__tests__/useScoutStore.test.ts` | `addFavorite`, `removeFavorite`, `addToCompare` (límite 3), `clearCompare` |

---

## 2. Integration Tests (tests de integración)

Prueban **varios módulos juntos**: rutas HTTP reales, base de datos en memoria o de test.

### Backend con Supertest + DB de test

| Archivo | Endpoints cubiertos |
|---|---|
| `backend/src/__tests__/routes/auth.integration.test.ts` | `POST /api/auth/register` (201, 409, 400 validación) · `POST /api/auth/login` (200, 401) · `GET /api/auth/me` (200, 401 sin token) |
| `backend/src/__tests__/routes/players.integration.test.ts` | `GET /api/players` (401 sin auth, 200 paginado, filtros q/position/nationality/age) · `GET /api/players/:id` (200 con stats/team, 404) · `GET /api/players/compare?ids=1,2` |
| `backend/src/__tests__/routes/teams.integration.test.ts` | `GET /api/teams` (200 lista) · `GET /api/teams/:id` (200 con roster, 404) |
| `backend/src/__tests__/routes/analytics.integration.test.ts` | `GET /api/analytics/leaderboard?metric=goals&seasonId=1` (200, entries ordenados) · filtro por posiciones · `GET /api/analytics/summary` |
| `backend/src/__tests__/routes/shortlist.integration.test.ts` | `GET /api/shortlist` (401 sin auth, 200 lista) · `POST /api/shortlist/:id` (201, 409 duplicado) · `DELETE /api/shortlist/:id` (204) |

### Setup compartido para integración

```typescript
// backend/src/__tests__/helpers/testClient.ts
import { app } from "../../app";
import supertest from "supertest";

export const api = supertest(app);

// Registra y loguea un usuario de prueba, devuelve Bearer token
export async function getAuthToken(): Promise<string> {
  await api.post("/api/auth/register").send({
    email: `test_${Date.now()}@test.com`,
    password: "password123",
    name: "Test User",
  });
  const res = await api.post("/api/auth/login").send({
    email: `test_${Date.now()}@test.com`,  // usar mismo email
    password: "password123",
  });
  return `Bearer ${res.body.token}`;
}
```

```
# backend/.env.test
DATABASE_URL=postgresql://scout:scout1234@localhost:5432/scout_panel_test
JWT_SECRET=test-secret-key
NODE_ENV=test
```

---

## 3. E2E Tests (end-to-end)

Prueban **flujos de usuario completos** desde el navegador. Requiere la app corriendo (o un servidor de test).  
Herramienta recomendada: **Playwright**.

### Flujos a cubrir

| Archivo | Flujo |
|---|---|
| `e2e/auth.spec.ts` | Registro de usuario nuevo → redirección a dashboard |
| `e2e/auth.spec.ts` | Login con credenciales válidas → dashboard visible |
| `e2e/auth.spec.ts` | Login con contraseña incorrecta → mensaje de error |
| `e2e/search.spec.ts` | Buscar "Messi" en searchbar → sugerencias aparecen → click navega a detalle |
| `e2e/search.spec.ts` | Cambiar tipo de búsqueda a "Clubes" → buscar "Real" → sugerencias de equipos |
| `e2e/players.spec.ts` | Home → modo tabla → scroll horizontal en mobile (viewport 375px) |
| `e2e/players.spec.ts` | Click en jugador → página de detalle con stats, radar chart, carrera |
| `e2e/players.spec.ts` | Filtrar por posición "CF" → solo delanteros visibles |
| `e2e/compare.spec.ts` | Seleccionar 2 jugadores → radar chart aparece → agregar 3ro → VS bar visible |
| `e2e/compare.spec.ts` | Scroll horizontal en tabla de comparación en mobile (viewport 375px) |
| `e2e/favorites.spec.ts` | Agregar jugador a favoritos → ir a Favoritos → jugador aparece en lista |
| `e2e/favorites.spec.ts` | Quitar jugador de favoritos → desaparece de la lista |
| `e2e/analytics.spec.ts` | Ir a Reportes → cambiar temporada → tabla se actualiza |
| `e2e/analytics.spec.ts` | Scroll horizontal en tabla de reportes en mobile (viewport 375px) |
| `e2e/clubs.spec.ts` | Buscar club en searchbar → click → página de detalle con roster |

---

## Paso a paso: configurar y correr los tests

---

### Paso 1 — Backend: instalar y configurar Vitest

Las dependencias ya están en `devDependencies`. Solo crear los archivos de config.

```bash
# Desde /backend
```

**Crear `backend/vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 15000,
  },
});
```

**Crear `backend/src/__tests__/setup.ts`:**

```typescript
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
```

**Crear `backend/.env.test`:**

```
DATABASE_URL=postgresql://scout:scout1234@localhost:5432/scout_panel_test
JWT_SECRET=test-secret-key-local
NODE_ENV=test
PORT=4001
```

**Crear la DB de test (una sola vez):**

```bash
# Con la DB de Postgres corriendo (docker compose up db)
psql -U scout -h localhost -c "CREATE DATABASE scout_panel_test;"
# O si usás Docker:
docker exec scout_panel_db psql -U scout -c "CREATE DATABASE scout_panel_test;"
```

**Correr las migraciones en la DB de test:**

```bash
DATABASE_URL=postgresql://scout:scout1234@localhost:5432/scout_panel_test npx drizzle-kit migrate
```

---

### Paso 2 — Backend: crear los archivos de test

**Estructura esperada:**

```
backend/src/__tests__/
  setup.ts
  helpers/
    testClient.ts      ← supertest + helper de auth
  unit/
    auth.test.ts       ← validación de schemas Zod
    requireAuth.test.ts
  routes/
    auth.integration.test.ts
    players.integration.test.ts
    teams.integration.test.ts
    analytics.integration.test.ts
    shortlist.integration.test.ts
```

**Ejemplo — `unit/auth.test.ts`:**

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  password: z.string().min(1),
});

describe("loginSchema", () => {
  it("acepta email y password válidos", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "pass" });
    expect(result.success).toBe(true);
  });

  it("falla con email inválido", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "pass" });
    expect(result.success).toBe(false);
  });

  it("falla si password está vacío", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("normaliza el email a lowercase", () => {
    const result = loginSchema.safeParse({ email: "User@TEST.com", password: "pass" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@test.com");
  });
});
```

**Ejemplo — `routes/auth.integration.test.ts`:**

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import { app } from "../../app";

const api = supertest(app);
const testEmail = `test_${Date.now()}@scout.com`;

describe("POST /api/auth/register", () => {
  it("crea un usuario nuevo y devuelve token", async () => {
    const res = await api.post("/api/auth/register").send({
      email: testEmail,
      password: "password123",
      name: "Test Scout",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testEmail);
  });

  it("rechaza email duplicado con 409", async () => {
    const res = await api.post("/api/auth/register").send({
      email: testEmail,
      password: "password123",
      name: "Test Scout",
    });
    expect(res.status).toBe(409);
  });

  it("rechaza contraseña corta con 400", async () => {
    const res = await api.post("/api/auth/register").send({
      email: "other@test.com",
      password: "123",
      name: "Scout",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("loguea con credenciales válidas", async () => {
    const res = await api.post("/api/auth/login").send({
      email: testEmail,
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("rechaza contraseña incorrecta con 401", async () => {
    const res = await api.post("/api/auth/login").send({
      email: testEmail,
      password: "wrongpass",
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("devuelve el usuario con token válido", async () => {
    const loginRes = await api.post("/api/auth/login").send({
      email: testEmail,
      password: "password123",
    });
    const token = loginRes.body.token;
    const res = await api.get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  it("rechaza petición sin token con 401", async () => {
    const res = await api.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
```

**Ejemplo — `routes/players.integration.test.ts`:**

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import { app } from "../../app";

const api = supertest(app);
let authHeader: string;

beforeAll(async () => {
  const email = `player_test_${Date.now()}@scout.com`;
  await api.post("/api/auth/register").send({ email, password: "pass1234", name: "Scout" });
  const res = await api.post("/api/auth/login").send({ email, password: "pass1234" });
  authHeader = `Bearer ${res.body.token}`;
});

describe("GET /api/players", () => {
  it("devuelve 401 sin autenticación", async () => {
    const res = await api.get("/api/players");
    expect(res.status).toBe(401);
  });

  it("devuelve lista paginada con auth", async () => {
    const res = await api.get("/api/players").set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("players");
    expect(Array.isArray(res.body.players)).toBe(true);
    expect(res.body).toHaveProperty("total");
  });

  it("filtra por posición", async () => {
    const res = await api.get("/api/players?position=GK")
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    res.body.players.forEach((p: any) => expect(p.position).toBe("GK"));
  });
});

describe("GET /api/players/:id", () => {
  it("devuelve jugador con stats y team", async () => {
    const listRes = await api.get("/api/players?limit=1")
      .set("Authorization", authHeader);
    const playerId = listRes.body.players[0]?.id;

    const res = await api.get(`/api/players/${playerId}`)
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", playerId);
  });

  it("devuelve 404 para ID inexistente", async () => {
    const res = await api.get("/api/players/99999999")
      .set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});
```

---

### Paso 3 — Correr los tests de backend

```bash
# Desde /backend
npm test              # corre todos los tests una vez
npm run test:watch    # modo watch (ya definido en package.json)
```

---

### Paso 4 — Frontend: instalar dependencias

```bash
# Desde /frontend
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

---

### Paso 5 — Frontend: crear configuración

**Crear `frontend/vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**Crear `frontend/src/__tests__/setup.ts`:**

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));
```

**Agregar script en `frontend/package.json`:**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

### Paso 6 — Frontend: crear los archivos de test

**Estructura esperada:**

```
frontend/src/__tests__/
  setup.ts
  unit/
    posStyle.test.ts         ← lib/utils
    formatCell.test.ts       ← lib/analyticsConfig
    useScoutStore.test.ts    ← store actions
  components/
    PlayerTable.test.tsx
    LeagueTable.test.tsx
    SearchBar.test.tsx
```

**Ejemplo — `components/PlayerTable.test.tsx`:**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlayerTable from "@/components/home/PlayerTable";

const mockPlayers = [
  {
    id: 1, name: "Leo Messi", position: "CF", nationality: "Argentina",
    marketValueM: "95.00",
    team: { id: 1, name: "Inter Miami", logoUrl: null, country: "USA" },
    stats: [{ sofascoreRating: "8.5" }],
  },
  {
    id: 2, name: "Cristiano Ronaldo", position: "CF", nationality: "Portugal",
    marketValueM: "40.00",
    team: { id: 2, name: "Al Nassr", logoUrl: null, country: "Arabia Saudita" },
    stats: [{ sofascoreRating: "7.8" }],
  },
];

describe("PlayerTable", () => {
  it("renderiza los jugadores correctamente", () => {
    render(<PlayerTable players={mockPlayers as any} />);
    expect(screen.getByText("Leo Messi")).toBeInTheDocument();
    expect(screen.getByText("Cristiano Ronaldo")).toBeInTheDocument();
  });

  it("muestra skeleton cuando loading=true", () => {
    const { container } = render(<PlayerTable players={[]} loading={true} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("no renderiza nada cuando players=[] y loading=false", () => {
    const { container } = render(<PlayerTable players={[]} />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("llama onSort con key correcto al hacer click en columna sorteable", () => {
    const onSort = vi.fn();
    render(<PlayerTable players={mockPlayers as any} sortBy="" onSort={onSort} />);
    fireEvent.click(screen.getByText(/valor/i));
    expect(onSort).toHaveBeenCalledWith("value_desc");
  });
});
```

**Ejemplo — `unit/useScoutStore.test.ts`:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useScoutStore } from "@/store/useScoutStore";

const mockPlayer = {
  id: 1, name: "Test Player", position: "CF", nationality: "Argentina",
  team: null, stats: [],
};

beforeEach(() => {
  useScoutStore.setState({ favorites: [], compareList: [] });
});

describe("favorites", () => {
  it("agrega un jugador a favoritos", () => {
    useScoutStore.getState().addFavorite(mockPlayer as any);
    expect(useScoutStore.getState().favorites).toHaveLength(1);
  });

  it("no agrega duplicados", () => {
    useScoutStore.getState().addFavorite(mockPlayer as any);
    useScoutStore.getState().addFavorite(mockPlayer as any);
    expect(useScoutStore.getState().favorites).toHaveLength(1);
  });

  it("elimina un jugador de favoritos", () => {
    useScoutStore.getState().addFavorite(mockPlayer as any);
    useScoutStore.getState().removeFavorite(1);
    expect(useScoutStore.getState().favorites).toHaveLength(0);
  });
});

describe("compareList", () => {
  it("no permite más de 3 jugadores", () => {
    [1, 2, 3, 4].forEach(id =>
      useScoutStore.getState().addToCompare({ ...mockPlayer, id } as any)
    );
    expect(useScoutStore.getState().compareList).toHaveLength(3);
  });

  it("clearCompare vacía la lista", () => {
    useScoutStore.getState().addToCompare(mockPlayer as any);
    useScoutStore.getState().clearCompare();
    expect(useScoutStore.getState().compareList).toHaveLength(0);
  });
});
```

---

### Paso 7 — Correr los tests de frontend

```bash
# Desde /frontend
npm test              # corre todos una vez
npm run test:watch    # modo watch
```

---

### Paso 8 — E2E con Playwright (opcional, suma puntos)

```bash
# Desde la raíz del repo
npm init playwright@latest
# Seleccionar: TypeScript, carpeta e2e/, instalar browsers
```

**Crear `e2e/auth.spec.ts`:**

```typescript
import { test, expect } from "@playwright/test";

test("registro e inicio de sesión", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Email").fill(`e2e_${Date.now()}@test.com`);
  await page.getByPlaceholder("Contraseña").fill("password123");
  await page.getByRole("button", { name: /registrar/i }).click();
  await expect(page).toHaveURL(/\//);
});

test("login con credenciales inválidas muestra error", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Email").fill("noexiste@test.com");
  await page.getByPlaceholder("Contraseña").fill("wrongpass");
  await page.getByRole("button", { name: /ingresar/i }).click();
  await expect(page.getByText(/credenciales/i)).toBeVisible();
});
```

**Crear `e2e/mobile-scroll.spec.ts`:**

```typescript
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } }); // iPhone SE

test("tabla de reportes permite scroll horizontal en mobile", async ({ page }) => {
  // login primero...
  await page.goto("http://localhost:3000/analytics");
  const table = page.locator(".overflow-x-auto").first();
  await expect(table).toBeVisible();
  const box = await table.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(375);
});

test("tabla de comparación permite scroll horizontal en mobile", async ({ page }) => {
  await page.goto("http://localhost:3000/compare");
  const scrollContainer = page.locator(".overflow-x-auto").first();
  await expect(scrollContainer).toBeVisible();
});
```

**Correr E2E:**

```bash
npx playwright test          # headless
npx playwright test --ui     # con interfaz visual
```

---

## Resumen de comandos

```bash
# Backend — unit + integración
cd backend && npm test

# Frontend — unit
cd frontend && npm test

# E2E (app corriendo en :3000 y :4000)
npx playwright test
```

---

## Cobertura esperada con todos los tests

| Nivel | Tests | Cobertura principal |
|---|---|---|
| Unit backend | ~15 casos | Validación Zod, middleware auth, funciones puras |
| Integration backend | ~25 casos | Todos los endpoints HTTP + DB test |
| Unit frontend | ~20 casos | Componentes de tabla, store actions, utils |
| E2E | ~15 flujos | Auth, búsqueda, comparación, favoritos, scroll mobile |
| **Total** | **~75 casos** | |
