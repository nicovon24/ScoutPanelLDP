# Backend Code Review — ScoutPanel API

**Reviewed:** 2026-04-19  
**Depth:** Deep (cross-file analysis)  
**Files Reviewed:** 7 source files  
**Reviewer:** Claude (gsd-code-reviewer)

---

## Executive Summary

The backend is well-structured for a development prototype: it uses sensible tools (Drizzle ORM, bcrypt, JWT, pg), the schema is clean, and the authentication flow is functionally correct. However, **it is not production-ready in its current state**. The three most urgent issues are: (1) a hardcoded JWT secret fallback that silently allows token forgery if the env var is missing, (2) no rate limiting on `/login` and `/register` enabling unlimited brute-force attacks, and (3) an unbounded `limit` query parameter that allows a single request to attempt returning millions of rows. Additionally, `requireAuth` is globally disabled, making all scouting data fully public — this may be intentional during development but must be documented and addressed before any deployment. These four items must be fixed before exposing the API to a network.

---

## Findings Table

| ID | Severity | Location | Title |
|----|----------|----------|-------|
| F-01 | **BLOCKER** | `src/routes/auth.ts:9` | JWT_SECRET hardcoded fallback allows token forgery |
| F-02 | **BLOCKER** | `src/routes/auth.ts` (login/register) | No rate limiting on auth endpoints |
| F-03 | **BLOCKER** | `src/routes/players.ts:119,274` | Unbounded `limit` parameter enables DoS |
| F-04 | **HIGH** | `src/routes/players.ts:72` | NaN IDs propagate to DB in `/compare` |
| F-05 | **HIGH** | `src/routes/players.ts:72` | No upper bound on number of IDs in `/compare` |
| F-06 | **HIGH** | `src/routes/players.ts:76` | `seasonId` not validated in `/compare` |
| F-07 | **HIGH** | `src/index.ts:12` | CORS fully open — any origin allowed |
| F-08 | **HIGH** | `src/routes/auth.ts:31` | No email format validation on `/register` |
| F-09 | **MEDIUM** | `src/index.ts:19` | `requireAuth` globally disabled |
| F-10 | **MEDIUM** | `src/routes/players.ts:261,270` | `sidVal` injected into raw SQL (unparameterized) |
| F-11 | **MEDIUM** | `src/routes/players.ts:263` | `orderByClause` interpolated into raw SQL |
| F-12 | **MEDIUM** | `src/routes/players.ts:315-329` | Drizzle ORM path is dead code (never executed) |
| F-13 | **MEDIUM** | `src/routes/players.ts:276` | Dynamic `import()` inside request handler |
| F-14 | **MEDIUM** | `src/db/index.ts:14` | No max pool size configured |
| F-15 | **MEDIUM** | `src/db/index.ts:8` | `dotenv` resolved via `__dirname` — breaks in Docker |
| F-16 | **MEDIUM** | `src/routes/shortlist.ts:16` | No pagination on `GET /api/shortlist` |
| F-17 | **MEDIUM** | `src/index.ts` | No `helmet.js` — missing security headers |
| F-18 | **MEDIUM** | `src/routes/players.ts:119` | `page` and `limit` not validated (NaN / negative) |
| F-19 | **MEDIUM** | `src/routes/players.ts:139,211` | `teamId` array not guarded against NaN |
| F-20 | **LOW** | `src/routes/teams.ts:2` | Dead import: `players` never used |
| F-21 | **LOW** | Multiple files | `(req as any).user` bypasses TypeScript type system |
| F-22 | **LOW** | `src/routes/auth.ts` | Inconsistent error message language (ES/EN) |
| F-23 | **LOW** | All routes | No centralized error handler — duplicated try/catch |
| F-24 | **INFO** | `src/routes/teams.ts:10` | `GET /api/teams` returns all rows with no pagination |
| F-25 | **INFO** | `src/db/schema.ts` | No stats-column indexes for future reporting queries |
| F-26 | **INFO** | `src/routes/auth.ts:34` | Password minimum (6 chars) is below industry standard |
| F-27 | **INFO** | `src/index.ts` | No request logging middleware (Morgan etc.) |

---

## Detailed Findings

### F-01 — BLOCKER: JWT_SECRET hardcoded fallback allows token forgery

**File:** `src/routes/auth.ts:9`

```typescript
const JWT_SECRET = process.env.JWT_SECRET ?? "scout-panel-secret-dev";
```

**Issue:** If `JWT_SECRET` is not set in the environment, the application silently falls back to the well-known string `"scout-panel-secret-dev"` (visible in source control). Anyone who has read the source code can craft a perfectly valid JWT signed with this key and impersonate any user, including future admin accounts.

**Fix:** Fail at startup if the secret is not set — never allow an insecure default.

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
```

---

### F-02 — BLOCKER: No rate limiting on `/login` and `/register`

**File:** `src/routes/auth.ts` (lines 28–91)

**Issue:** Both POST endpoints accept unlimited requests with no throttling. An attacker can send thousands of password attempts per second against `/login` (brute-force) or spam `/register` to exhaust DB storage and connections.

**Fix:** Add `express-rate-limit` as a targeted middleware on auth routes:

```typescript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", authLimiter, async (req, res) => { ... });
router.post("/register", authLimiter, async (req, res) => { ... });
```

---

### F-03 — BLOCKER: Unbounded `limit` parameter enables DoS

**File:** `src/routes/players.ts:119,264,274`

```typescript
const offset = (Number(page) - 1) * Number(limit);
// ...
LIMIT $${idx++} OFFSET $${idx++}
// ...
const dataVals = [...vals, Number(limit), offset];
```

**Issue:** `limit` comes from `req.query` and is converted to a number with no maximum cap enforced. A request like `GET /api/players?limit=10000000` will attempt to return millions of rows, saturating DB, network, and memory.

**Fix:** Clamp both `page` and `limit` to safe ranges:

```typescript
const rawPage  = Math.max(1, parseInt(page as string, 10) || 1);
const rawLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
const offset   = (rawPage - 1) * rawLimit;
```

---

### F-04 — HIGH: NaN IDs propagate to DB in `/compare`

**File:** `src/routes/players.ts:72`

```typescript
const playerIds = (ids as string).split(",").map(Number);
```

**Issue:** `Number("abc")` evaluates to `NaN`. If any segment of the comma-separated `ids` is non-numeric, `playerIds` will contain `NaN`. This is passed directly to `inArray(players.id, playerIds)`, which will either throw a Postgres error or produce undefined behavior.

**Fix:**

```typescript
const playerIds = (ids as string)
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !isNaN(n));

if (playerIds.length === 0) {
  return res.status(400).json({ error: "No valid player IDs provided" });
}
```

---

### F-05 — HIGH: No upper bound on number of IDs in `/compare`

**File:** `src/routes/players.ts:72`

**Issue:** After parsing, `playerIds` is fed directly to `inArray(players.id, playerIds)` with no limit. Passing `ids=1,2,3,...,5000` generates a `WHERE id IN (1,2,3,...,5000)` clause that can be slow, large, and indicative of misuse. The compare UI shows 2–4 players; the API should mirror that intent.

**Fix:** Add a hard limit immediately after parsing:

```typescript
if (playerIds.length > 10) {
  return res.status(400).json({ error: "Maximum 10 players can be compared at once" });
}
```

---

### F-06 — HIGH: `seasonId` not validated in `/compare`

**File:** `src/routes/players.ts:76`

```typescript
sid = Number(seasonId);
```

**Issue:** If `seasonId` is a non-numeric string (e.g. `?seasonId=abc`), `sid` becomes `NaN`. `NaN` is then used in `eq(playerStats.seasonId, sid)` and `eq(playerRatings.seasonId, sid)`, producing a malformed query.

**Fix:**

```typescript
sid = parseInt(seasonId as string, 10);
if (isNaN(sid)) {
  return res.status(400).json({ error: "seasonId must be a valid integer" });
}
```

---

### F-07 — HIGH: CORS fully open

**File:** `src/index.ts:12`

```typescript
app.use(cors());
```

**Issue:** With no configuration, `cors()` responds with `Access-Control-Allow-Origin: *`, allowing any website to make cross-origin requests to the API. For a production app with auth cookies or sensitive scouting data, this grants malicious sites full API access from users' browsers.

**Fix:** Restrict to known origins:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
  credentials: true,
}));
```

---

### F-08 — HIGH: No email format validation on `/register`

**File:** `src/routes/auth.ts:31`

```typescript
if (!email || !password || !name) { ... }
```

**Issue:** Only checks that `email` is truthy — any non-empty string (e.g. `"notanemail"`, `"a"`) passes validation and gets stored in the database. This can cause issues with password reset flows, notification systems, and data integrity.

**Fix:**

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: "Invalid email format" });
}
```

Or install `zod` and validate the entire body in one pass (see prerequisites section).

---

### F-09 — MEDIUM: `requireAuth` globally disabled

**File:** `src/index.ts:19`

```typescript
// app.use(requireAuth);  ← DISABLED
```

**Issue:** The comment block says these routes "need a token," but the middleware is commented out. `GET /api/players`, `GET /api/teams`, and `GET /api/seasons` are fully public. While intentional during development, this means all scouting data is accessible without authentication.

**Recommendation:** If public access is acceptable by design, document it explicitly in a comment and remove the misleading "Routes Protegidas" label. If authentication is required, re-enable the middleware or apply `requireAuth` per-router before the next deployment.

---

### F-10 — MEDIUM: `sidVal` injected directly into raw SQL

**File:** `src/routes/players.ts:261,270`

```typescript
LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}
// ...
LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}
```

**Issue:** `sidVal` is a JavaScript integer interpolated directly into the SQL template string — not a parameterized value. While it currently comes from the DB (safe), this pattern trains future contributors to interpolate values into SQL strings. One copy-paste with a user-supplied value becomes SQL injection.

**Fix:** Add `sidVal` as a parameterized value in `vals`:

```typescript
// Add sidVal as the first parameter
vals.unshift(sidVal);
// Adjust all subsequent $N indices by +1
// In the JOIN clause:
LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = $1
```

Alternatively, refactor to Drizzle's `sql` tagged template which handles parameterization automatically.

---

### F-11 — MEDIUM: `orderByClause` string interpolated into raw SQL

**File:** `src/routes/players.ts:263`

```typescript
ORDER BY ${orderByClause}, p.id ASC
```

**Issue:** `orderByClause` is a string from a `switch` statement with a safe default. It's safe _now_ — but the pattern is fragile. A future developer could add a case that uses `sortBy` directly (e.g. `case "custom": orderByClause = sortBy as string`), silently introducing SQL injection. The compiler won't catch it.

**Recommendation:** Enforce the safety in the type system. Use a `Record<string, string>` lookup map:

```typescript
const ORDER_MAP: Record<string, string> = {
  name_asc:   "p.name ASC",
  name_desc:  "p.name DESC",
  rating_desc: "COALESCE(ps.sofascore_rating, 0) DESC",
  // ...
};
const orderByClause = ORDER_MAP[sortBy as string] ?? ORDER_MAP["rating_desc"];
```

---

### F-12 — MEDIUM: Drizzle ORM path is dead code — never executed

**File:** `src/routes/players.ts:192,315-329`

```typescript
if (needsStatsSort || sid) {   // ← always true
  // raw SQL path ...
  return res.json({ items, totalItems });
}

// Simple query without stats sort   ← NEVER REACHED
const [data, totalRes] = await Promise.all([...]);
```

**Issue:** `sid = latestSeason?.id` is always a non-zero integer when the DB has any seasons. The condition `needsStatsSort || sid` is therefore always `true`, meaning the raw SQL branch always executes and the Drizzle ORM branch (lines 316–329) is unreachable dead code. This creates confusion: which path is authoritative? Which is tested?

**Fix:** Delete lines 315–329 and the dead comment. If the Drizzle ORM path was intended for when there are no seasons, handle that case explicitly at the top of the handler.

---

### F-13 — MEDIUM: Dynamic `import()` inside request handler

**File:** `src/routes/players.ts:276`

```typescript
const { pool } = await import("../db");
```

**Issue:** `pool` is imported dynamically on every single request to `GET /api/players`. While Node.js caches the module after the first load, each request still incurs an async microtask and a module cache lookup. More importantly, this is architecturally confusing — other routes import `db` at the top of the file. If `db/index.ts` ever throws (e.g. bad `DATABASE_URL`), the error happens mid-request rather than at startup.

**Fix:** Import at the top of the file, alongside `db`:

```typescript
import { db, pool } from "../db";
```

---

### F-14 — MEDIUM: No max pool size configured

**File:** `src/db/index.ts:14`

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

**Issue:** `pg.Pool` defaults to `max: 10` connections. Under concurrent load, all 10 connections can be saturated by a single burst of requests (especially the expensive player list query), causing subsequent requests to queue indefinitely.

**Fix:**

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
```

Expose `DB_POOL_MAX` as an environment variable so it can be tuned per deployment.

---

### F-15 — MEDIUM: `dotenv` path resolves via `__dirname` — breaks in Docker

**File:** `src/db/index.ts:8`

```typescript
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
```

**Issue:** After compilation, `__dirname` resolves to the `dist/` output directory. The path `../../../.env` assumes a specific project layout (`backend/dist/src/db/` → `backend/`) that won't hold in a Docker container where the working directory may differ.

**Fix:** Move `dotenv.config()` to `src/index.ts` (application entry point) before any other imports, and load from `process.cwd()`:

```typescript
// src/index.ts — first lines
import * as dotenv from "dotenv";
dotenv.config(); // reads .env from CWD, overridable by Docker env vars
```

In Docker, inject variables via `ENV` or `--env-file` instead of relying on file resolution.

---

### F-16 — MEDIUM: No pagination on `GET /api/shortlist`

**File:** `src/routes/shortlist.ts:16`

```typescript
const entries = await db.query.shortlistEntries.findMany({
  where: eq(shortlistEntries.userId, userId),
  with: { player: { with: { team: true, stats: { ... limit: 1 } } } },
  orderBy: ...
});
```

**Issue:** Returns all shortlist entries for the authenticated user in a single query with full player + team + stats joins. A user who scouted hundreds of players would trigger a heavy JOIN chain and receive a very large response payload.

**Fix:** Add `limit` and `offset` (or cursor-based pagination) consistent with `GET /api/players`:

```typescript
const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
const page  = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
```

---

### F-17 — MEDIUM: No `helmet.js` — missing security headers

**File:** `src/index.ts`

**Issue:** The Express app serves responses without standard security headers. Missing: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, `X-XSS-Protection`. These headers mitigate a class of browser-side attacks.

**Fix:**

```bash
npm install helmet
```

```typescript
import helmet from "helmet";
app.use(helmet());
```

Place this before all other `app.use()` calls.

---

### F-18 — MEDIUM: `page` and `limit` not validated as safe integers

**File:** `src/routes/players.ts:119`

```typescript
const offset = (Number(page) - 1) * Number(limit);
```

**Issue:** `Number("abc")` is `NaN`; `NaN - 1` is `NaN`; `NaN * NaN` is `NaN`. Passing `?page=abc` causes `offset = NaN`, which Postgres rejects with a runtime error. Similarly, `?page=-5` produces a negative offset, also a Postgres error.

**Fix:** Parse and clamp before use (combined with F-03 fix):

```typescript
const rawPage  = Math.max(1, parseInt(page as string, 10) || 1);
const rawLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
const offset   = (rawPage - 1) * rawLimit;
```

---

### F-19 — MEDIUM: `teamId` array not guarded against NaN

**File:** `src/routes/players.ts:139,211`

```typescript
const teamArr = (teamId as string).split(",").filter(Boolean).map(Number);
// ...
const teamArr = (teamId as string).split(",").map(Number);
```

**Issue:** Same NaN propagation as F-04. `?teamId=1,badvalue,3` produces `[1, NaN, 3]`. In the raw SQL path (line 211), the second variant doesn't even filter empty strings before mapping. `NaN` in the array passed to `= ANY($N)` may cause a Postgres type error.

**Fix:**

```typescript
const teamArr = (teamId as string)
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !isNaN(n) && n > 0);
if (teamArr.length === 0) { /* skip filter or return 400 */ }
```

---

### F-20 — LOW: Dead import in `teams.ts`

**File:** `src/routes/teams.ts:2`

```typescript
import { teams, players } from "../db/schema";
```

`players` is never referenced. Remove it to keep imports clean and avoid confusion.

---

### F-21 — LOW: `(req as any).user` bypasses TypeScript type system

**Files:** `src/routes/auth.ts:96`, `src/routes/shortlist.ts:15,41,56,77`

**Issue:** The `user` property set by `requireAuth` middleware is accessed via `(req as any).user`, giving up all type safety. If the JWT payload shape changes, no compiler error is raised.

**Fix:** Declare a module augmentation once (e.g. in `src/types/express.d.ts`):

```typescript
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: number; email: string; name: string };
    }
  }
}
```

Then use `req.user` directly everywhere.

---

### F-22 — LOW: Inconsistent error message language

**File:** `src/routes/auth.ts`

- `/register` errors → Spanish: `"email, password y nombre son requeridos"`, `"La contraseña debe tener al menos 6 caracteres"`
- `/login` errors → English: `"email and password are required"`, `"Invalid credentials"`

**Fix:** Pick one language for API error messages. Spanish is acceptable if the consumer is always a Spanish-language UI; English is standard for APIs. Apply consistently across all routes.

---

### F-23 — LOW: No centralized error handler — duplicated try/catch

**All route files** repeat the same pattern:

```typescript
} catch (error) {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
```

**Fix:** Register a single Express error handler middleware in `src/index.ts` after all routes:

```typescript
import { Request, Response, NextFunction } from "express";

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
```

Then individual handlers can just call `next(error)` instead of duplicating the catch block.

---

### F-24 — INFO: `GET /api/teams` returns all rows without pagination

**File:** `src/routes/teams.ts:10`

For the Liga Profesional dataset (~26–30 teams), this is harmless. Document it as an explicit design decision (acceptable for known-small dataset), or add a `SELECT id, name, logo_url FROM teams` projection instead of `SELECT *` to reduce payload.

---

### F-25 — INFO: No indexes on stats columns used for reporting

**File:** `src/db/schema.ts`

The only index on `player_stats` is `player_stats_player_season_idx ON (player_id, season_id)`. A future Reporting module running queries like:

```sql
ORDER BY goals DESC
ORDER BY xg_per_game DESC  
ORDER BY assists DESC
```

…will do full table scans on every request. For ~500 player-season rows, this is fast. For larger datasets, add:

```sql
CREATE INDEX player_stats_goals_idx ON player_stats (goals DESC);
CREATE INDEX player_stats_xg_idx    ON player_stats (xg_per_game DESC);
CREATE INDEX player_stats_assists_idx ON player_stats (assists DESC);
```

Or define them in the Drizzle schema alongside the existing index.

---

### F-26 — INFO: Password minimum of 6 characters is below standard

**File:** `src/routes/auth.ts:34`

Six characters is the absolute minimum accepted by NIST SP 800-63B but is widely considered weak. Consider raising to 8 minimum and adding a check against a list of common passwords, or simply enforcing 8+ now.

---

### F-27 — INFO: No request logging middleware

**File:** `src/index.ts`

No HTTP request logging. In production and during debugging it is very useful to have request method, path, status code, and response time logged for every request.

**Fix:** `npm install morgan @types/morgan` and add `app.use(morgan("combined"))`.

---

## Validation Gaps Per Endpoint

| Endpoint | Missing Validations |
|----------|---------------------|
| `POST /api/auth/register` | Email format check; name max length; password strength beyond 6-char minimum |
| `POST /api/auth/login` | No rate limiting (F-02) |
| `GET /api/players/` | `page` and `limit` not clamped or validated (F-03, F-18); `teamId` NaN (F-19); no max `limit` |
| `GET /api/players/search` | `q` param: no max length check (a 10,000-character ILIKE pattern is legal) |
| `GET /api/players/compare` | `ids` NaN (F-04); no count limit (F-05); `seasonId` NaN (F-06) |
| `GET /api/players/:id` | ✅ `isNaN` check present — good |
| `POST /api/shortlist/:playerId` | ✅ `isNaN` + player existence check — good |
| `DELETE /api/shortlist/:playerId` | ✅ `isNaN` check — minor: always returns 200 even if nothing deleted |
| `GET /api/shortlist` | No pagination (F-16) |
| `GET /api/teams` | No pagination (acceptable for small data) |
| `GET /api/seasons` | ✅ No user input — read-only; fine |

**General gap:** There is no input validation library (`zod`, `joi`, `express-validator`). All validation is scattered `if/return` checks written ad-hoc per route. This makes it easy to miss fields and hard to keep consistent. Installing `zod` and defining one schema per endpoint would address most of the above gaps in one shot.

---

## Pre-requisites for Next Phases

### (a) Before writing Jest + Supertest tests

1. **Fix F-15 (`dotenv` path):** The test runner needs predictable env loading. Move `dotenv.config()` to the entry point with no `__dirname` dependency.
2. **Fix F-13 (dynamic import):** Supertest needs a stable module graph. Dynamic imports inside handlers prevent mocking `pool` or `db` cleanly.
3. **Extract `app` from `app.listen()`:** `src/index.ts` calls `app.listen()` at import time. Supertest needs to import `app` without starting a server. Refactor to:
   ```typescript
   // src/app.ts — export the express app
   export const app = express();
   // src/index.ts — import and listen
   import { app } from "./app";
   app.listen(port, ...);
   ```
4. **Add a centralized error handler (F-23):** Consistent response shapes (`{ error: "..." }`) make test assertions reliable.
5. **Provide a test database:** Tests must not touch the production DB. A `.env.test` with a separate `DATABASE_URL` and a test setup/teardown script (Drizzle `migrate` + seed) is required.
6. **Re-enable `requireAuth` or make it injectable:** If auth is required, tests need a way to get a valid token or inject a mock user. Fix F-09 so the auth model is intentional and testable.

### (b) Before building the Reporting module (top players by xG, xA, goals, assists)

1. **Add stats indexes (F-25):** Without indexes on `goals`, `xg_per_game`, `assists`, every report query does a full scan — fine for 500 rows, unacceptable for 5,000+.
2. **Clean up dead code in `GET /api/players/` (F-12):** The Drizzle ORM path (lines 315–329) is dead. Delete it. The raw SQL path is the correct foundation for reporting queries — make it the clear, sole implementation.
3. **Fix `sidVal` interpolation (F-10):** Reporting queries will add more dynamic SQL. Establish proper parameterization now before the pattern is copied further.
4. **Add a dedicated `/api/reports` router:** Reporting queries (aggregation, ranking, per-position breakdowns) should live in their own route file, not extend the already-complex players handler.
5. **Season-scoped aggregation:** The schema already supports multi-season stats per player. Plan reports to accept an optional `seasonId` filter (already validated once F-06 is fixed) and a `topN` limit (capped, e.g. max 50).

### (c) Before Docker deployment

The following must all be addressed — none are optional for Docker:

1. **F-01 — Remove JWT_SECRET fallback:** The Dockerfile / compose file must supply `JWT_SECRET`. The app should throw at startup if it's missing.
2. **F-15 — Fix dotenv path:** Use environment variables injected at runtime (`ENV` in Dockerfile or `env_file` in compose), not file-based `dotenv` resolution.
3. **F-07 — Restrict CORS:** Set `ALLOWED_ORIGINS` env var to the actual frontend URL (e.g. `https://scoutpanel.app`).
4. **F-17 — Add helmet.js:** Required before exposing to the internet.
5. **F-02 — Add rate limiting:** Required before exposing auth endpoints to the internet.
6. **F-14 — Configure pool size:** Set `DB_POOL_MAX` based on the Postgres instance's `max_connections` setting (typically 100; use 10–20 for the app).
7. **`/health` endpoint:** Already exists at `GET /health` — wire this to the Docker `HEALTHCHECK` instruction:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
     CMD curl -f http://localhost:4000/health || exit 1
   ```
8. **Provide `.env.example`:** Document all required env vars (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS`, `DB_POOL_MAX`) so the Dockerfile and compose file can be set up correctly.

---

## Positive Observations

- **bcrypt with cost factor 12** — solid choice for password hashing; not too slow, not too fast.
- **JWT token expiry** — 7-day expiry is reasonable; the token is not set to never expire.
- **Drizzle schema is clean** — well-normalized, foreign keys with cascade deletes, unique constraints on `email` and `(userId, playerId)`, composite index on `(player_id, season_id)`. The schema is production-quality.
- **`onConflictDoNothing` in POST shortlist** — correct idempotent behavior for a favorite-toggle.
- **sortBy whitelist with safe default** — the `switch` for `orderByClause` with a `default` case prevents invalid sort directions from being used.
- **`GET /api/players/search` route ordering** — declared before `/:id`, so the `/search` path is not captured as a dynamic ID.
- **`/health` endpoint** — already present; trivially integrates with Docker, Kubernetes, or load balancer health checks.
- **Drizzle relations defined** — enables clean `findMany({ with: { ... } })` queries without manual joins in most routes.
- **requireAuth on shortlist via `router.use()`** — the shortlist router correctly applies authentication middleware to all its routes as a group, so no route can accidentally be left unprotected.
- **Error messages don't leak stack traces to clients** — `console.error(error)` logs server-side while the client only receives `"Internal server error"`.

---

_Reviewed: 2026-04-19_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: Deep_
