# Code Review — LDP Scouting App

**Reviewed:** 2026-04-20  
**Depth:** Standard (full per-file read + cross-file analysis)  
**Files Reviewed:** 21  
**Status:** Issues found

---

## Summary

The app has a solid architecture with good separation of concerns, proper Zod validation on most endpoints, and a well-designed Zustand store. No SQL injection vectors were found — the raw SQL in `players.ts` and `analytics.ts` uses whitelisted column names and parameterized values correctly.

Key areas of concern:
- **One genuine data-loss bug** (local favorites never persist to localStorage).  
- **One auth security gap** (no rate limiting on login/register).  
- **Multiple uncaught error states** that silently mislead users.  
- **Widespread `any` usage** that erodes type safety in four frontend files.  
- **Schema design gaps** (nullable FK columns, missing unique constraint).

---

## CRITICAL

### CR-01: No Rate Limiting on Authentication Endpoints

**File:** `backend/src/routes/auth.ts:46` and `:77`  
**Issue:** `/api/auth/login` and `/api/auth/register` have no rate limiting. An attacker can make unlimited login attempts to brute-force passwords. This is especially dangerous since `bcrypt` with cost factor 12 imposes no HTTP-layer throttle.  
**Fix:** Add `express-rate-limit` (or equivalent) before the auth router:

```typescript
// In app.ts — before app.use("/api/auth", authRoutes)
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: "Demasiados intentos. Esperá antes de reintentar." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRoutes);
```

---

## HIGH

### HI-01: Local Favorites Lost on Every Page Refresh

**File:** `frontend/src/store/useScoutStore.ts:166-178`  
**Issue:** The `persist` middleware's `partialize` function explicitly omits `favorites` from the persisted state. Users who aren't logged in will lose all locally-saved favorite players on every page reload. The comment above even acknowledges that `shortlistIds` should not be persisted (server state) — `favorites` is the opposite: it *should* be persisted.

```typescript
// Current — favorites is NOT included:
partialize: (s) => ({
  searchFilters: s.searchFilters,
  pageSize: s.pageSize,
  sidebarExpanded: s.sidebarExpanded,
  compareList: s.compareList,
}),
```

**Fix:** Add `favorites` to the partialize output:

```typescript
partialize: (s) => ({
  favorites: s.favorites,
  searchFilters: s.searchFilters,
  pageSize: s.pageSize,
  sidebarExpanded: s.sidebarExpanded,
  compareList: s.compareList,
}),
```

---

### HI-02: API Errors Silently Show "Not Found" on the Player Detail Page

**File:** `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:53-70`  
**Issue:** When the API call fails (network error, 500, etc.), the `catch` block only calls `console.error`. The component lands in `loading=false, player=null` state and renders `"Jugador no encontrado."` — which is incorrect for a server error and could confuse users or mask infrastructure problems.

```typescript
// Current:
.catch(console.error)
.finally(() => setLoading(false));

if (!player) return <p className="text-center text-muted py-32">Jugador no encontrado.</p>;
```

**Fix:** Track an error state separately:

```typescript
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  api.get(`/players/${id}`)
    .then(({ data }) => { /* ... */ })
    .catch((e) => {
      if (e.response?.status === 404) setError("Jugador no encontrado.");
      else setError("Error al cargar el jugador. Intentá de nuevo.");
    })
    .finally(() => setLoading(false));
}, [id]);

if (error) return <p className="text-center text-muted py-32">{error}</p>;
```

---

### HI-03: No Shortlist Size Limit Per User

**File:** `backend/src/routes/shortlist.ts:53-71`  
**Issue:** `POST /api/shortlist/:playerId` has no upper bound on how many players a user can add. A malicious authenticated user can add thousands of entries, causing unbounded DB growth and slow queries on the `GET /api/shortlist` endpoint (which does a join with `with: { player: { with: { team, stats } } }`).  
**Fix:** Add a count check before inserting:

```typescript
router.post("/:playerId", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const playerId = parseInt(req.params.playerId, 10);
  if (isNaN(playerId)) return res.status(400).json({ error: "playerId inválido" });

  // Guard: max 200 entries per user
  const count = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(shortlistEntries)
    .where(eq(shortlistEntries.userId, userId));
  if ((count[0]?.c ?? 0) >= 200) {
    return res.status(422).json({ error: "Límite de 200 favoritos alcanzado" });
  }
  // ... existing logic
});
```

---

### HI-04: N+1 API Requests on Favorites Page (Unauthenticated)

**File:** `frontend/src/app/(routes)/(dashboard)/favorites/page.tsx:30-31`  
**Issue:** When a user is not logged in, the page fires one API request per saved favorite player. With 20 favorites this means 20 simultaneous requests — each fetching the full player detail (with stats, injuries, career, ratings). This will be very slow and hammers the backend.

```typescript
// Current — one request per favorite:
Promise.all(favorites.map((f) => api.get(`/players/${f.id}`).then((r) => r.data)))
```

**Fix:** The `/api/players/compare` endpoint already accepts a comma-separated list of IDs and returns full player data. Reuse it:

```typescript
const ids = favorites.map((f) => f.id).join(",");
const { data } = await api.get(`/players/compare?ids=${ids}`);
setPlayers(data);
```

---

### HI-05: Direct `setState` Bypasses `addToCompare` Business Logic

**File:** `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:250`  
**Issue:** The "Comparar" button calls `useScoutStore.setState({ compareList: [player] })` directly, bypassing the `addToCompare` action which enforces the 3-player cap and deduplication. The `player` object here is typed as `any`, so it also skips the `Player` interface contract.

```typescript
// Current — bypasses action guards:
onClick={() => {
  useScoutStore.setState({ compareList: [player] });
  router.push('/compare');
}}
```

**Fix:** Use the store's own actions:

```typescript
onClick={() => {
  useScoutStore.getState().clearCompare();
  useScoutStore.getState().addToCompare(player);
  router.push('/compare');
}}
```

---

## MEDIUM

### ME-01: Pervasive `any` Type Usage in Frontend Pages

**Files:**
- `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:44, 57-58, 75-76, 229, 526`
- `frontend/src/app/(routes)/(dashboard)/compare/page.tsx:56-58, 104`
- `frontend/src/app/(routes)/(dashboard)/favorites/page.tsx:15`

**Issue:** `useState<any>(null)`, `(a: any, b: any) => ...`, and inline `any` casts throughout these pages eliminate TypeScript's value entirely. Any shape mismatch between backend response and UI usage becomes a silent runtime error.

**Fix:** Define or import the `Player` type from `@/types` and use it. For API responses that don't yet have types, define minimal interfaces at the top of the file:

```typescript
// players/[id]/page.tsx — replace:
const [player, setPlayer] = useState<any>(null);
// with:
import type { Player } from "@/types";
const [player, setPlayer] = useState<Player | null>(null);
```

For the stats sorts, replace:
```typescript
.sort((a: any, b: any) => b.season?.year - a.season?.year)
// with a typed stat type
.sort((a: PlayerStat, b: PlayerStat) => (b.season?.year ?? 0) - (a.season?.year ?? 0))
```

---

### ME-02: Nullable Foreign Keys on `playerStats` and `playerRatings`

**File:** `backend/src/db/schema.ts:73-74, 151-152`  
**Issue:** `playerId` and `seasonId` on `playerStats` and `playerRatings` are defined without `.notNull()`. This means rows can exist with `player_id = NULL` or `season_id = NULL` at the database level, which would cause `onDelete: "cascade"` to behave unexpectedly (NULLs are not FK-matched, so cascade doesn't fire). All application queries assume these are set.

```typescript
// Current:
playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
seasonId: integer("season_id").references(() => seasons.id, { onDelete: "cascade" }),

// Fix:
playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
seasonId: integer("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
```

Same fix applies to `playerRatings` at lines 151-152.

---

### ME-03: No Unique Constraint on `(playerId, seasonId)` in `playerStats`

**File:** `backend/src/db/schema.ts:120-123`  
**Issue:** The table has only a regular index on `(playerId, seasonId)`, not a unique index. Multiple stat rows for the same player+season can be inserted. The application code that reads stats (e.g., `compare` endpoint's `where: eq(playerStats.seasonId, sid)`) expects at most one row per player per season. Duplicate rows would silently corrupt comparisons and chart data.

```typescript
// Fix — change the index to a unique constraint:
(t) => ({
  playerSeasonUnique: uniqueIndex("player_stats_player_season_unique").on(t.playerId, t.seasonId),
})
```

---

### ME-04: Raw SQL Interpolates `sidVal` Without Parameterization

**File:** `backend/src/routes/players.ts:282, 291`  
**Issue:** `sidVal` (a DB-sourced integer) is string-interpolated into the raw SQL query rather than passed as a parameter. While this is safe in practice today (it's always an integer), it mixes parameterized and non-parameterized patterns in the same query, making future code changes error-prone.

```typescript
// Current:
`LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}`

// Fix — add sidVal to the params array at the top and use a positional placeholder:
vals.push(sidVal);            // push before other params
const sidParam = `$${idx++}`; // remember its position
// then in the query:
`LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidParam}`
```

---

### ME-05: Stale `playersData` in Compare Page `useEffect`

**File:** `frontend/src/app/(routes)/(dashboard)/compare/page.tsx:80-86`  
**Issue:** The `useEffect` reads `playersData[i]` directly from its closure to decide whether to re-fetch, but `playersData` is not in the dependency array. The ESLint disable comment suppresses the warning. When `slots` changes but `playersData` has not yet updated in the closure, the condition `playersData[i].id !== s.id` can be stale, causing a fetch to be skipped or a stale data read.

```typescript
// Fix — use a ref to track which IDs are already loaded,
// or restructure to avoid reading stale state:
const loadedIdsRef = useRef<(number | null)[]>([null, null, null]);

useEffect(() => {
  slots.forEach((s, i) => {
    if (s) {
      if (loadedIdsRef.current[i] !== s.id) {
        loadedIdsRef.current[i] = s.id;
        fetchPlayer(s.id, i);
      }
    } else {
      loadedIdsRef.current[i] = null;
      setPlayersData(prev => { const o = [...prev]; o[i] = null; return o; });
    }
  });
}, [slots, fetchPlayer]);
```

---

### ME-06: Search Suggestions Never Retry After Network Error

**File:** `frontend/src/components/ui/SearchBar.tsx:41-43`  
**Issue:** `suggestionsLoadedRef.current` is set to `true` before the async call completes. If the request fails (network error on first focus), the ref stays `true` and suggestions are never attempted again for the lifetime of the component.

```typescript
// Current:
const loadSuggestions = useCallback(async () => {
  if (suggestionsLoadedRef.current) return;
  suggestionsLoadedRef.current = true;  // ← set before await
  try {
    ...
  } catch { /* ignore */ }
}, [favorites]);

// Fix — only set the ref on success:
const loadSuggestions = useCallback(async () => {
  if (suggestionsLoadedRef.current) return;
  try {
    // ... fetch
    suggestionsLoadedRef.current = true;  // ← set after success
    setSuggestions({ players: [...favPlayers, ...restPlayers], teams });
  } catch { /* ignore */ }
}, [favorites]);
```

---

### ME-07: `parseInt` Missing Radix Argument in `shortlist.ts`

**File:** `backend/src/routes/shortlist.ts:56, 77`  
**Issue:** `parseInt(req.params.playerId)` omits the radix. While modern engines default to base 10, this is inconsistent with the rest of the codebase (players.ts, teams.ts all use `parseInt(..., 10)`) and could behave unexpectedly with inputs like `"010"`.

```typescript
// Fix:
const playerId = parseInt(req.params.playerId, 10);
```

---

### ME-08: JWT Cookie Not Marked HttpOnly

**File:** `frontend/src/store/useScoutStore.ts:6-10`  
**Issue:** The `accessToken` cookie is set via JavaScript (`js-cookie`) and therefore cannot be `HttpOnly`. Any XSS vulnerability anywhere on the frontend would expose the JWT to `document.cookie` reads. The API interceptor reads the token from memory (Zustand) on each request, so it's possible to move the persistent storage server-side.

**Fix (preferred):** Have the backend set a `Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict` header on login/register responses, and remove the client-side `Cookies.set` call. The client-side store only holds the in-memory token state — no cookie management needed on the frontend.

**Minimal fix (if server-side cookies aren't feasible):** Consider that the current setup has the same risk as any SPA with JWT-in-localStorage. Ensure all dynamic HTML rendering goes through React (no `dangerouslySetInnerHTML` with unsanitized data).

---

### ME-09: Missing Error State in `ClubPage` for Non-404 Failures

**File:** `frontend/src/app/(routes)/(dashboard)/clubs/[id]/page.tsx:50-54`  
**Issue:** Only 404 sets `notFound = true`. Any other error (network failure, 500) leaves `loading=false, team=null, notFound=false`, and the component falls through to the `notFound || !team` guard showing "Club no encontrado" — which is incorrect for a server error.

```typescript
// Fix:
.catch((e) => {
  if (e.response?.status === 404) setNotFound(true);
  else setError("No se pudo cargar el equipo. Intentá de nuevo.");
})
```

---

## LOW

### LO-01: Hardcoded Season Label in PlayerTable

**File:** `frontend/src/components/home/PlayerTable.tsx:116`  
**Issue:** The sub-header below each player name is hardcoded as `"Apertura 2026"`. This will become incorrect as seasons change and is misleading since the table shows players from whatever season the parent fetches.

```tsx
// Current:
<p className="text-[11px] text-muted truncate">Apertura 2026</p>

// Fix — pass the season name as a prop or derive from the player's stats:
// If no season prop, render nothing or "Sin temporada"
{p.stats?.[0]?.season?.name && (
  <p className="text-[11px] text-muted truncate">{p.stats[0].season.name}</p>
)}
```

---

### LO-02: Auth Middleware Pattern Inconsistency

**File:** `backend/src/app.ts:41-45`  
**Issue:** All protected routes apply `requireAuth` at the `app.use()` call site — except `/api/shortlist`, which applies it at the router level (`router.use(requireAuth)` in `shortlist.ts`). The end result is identical, but this inconsistency makes it easy for a future developer to miss that shortlist is auth-protected when reading `app.ts`.

```typescript
// Fix — align with the rest:
app.use("/api/shortlist", requireAuth, shortlistRoutes);
// And remove router.use(requireAuth) from shortlist.ts
```

---

### LO-03: No Request Body Size Limit

**File:** `backend/src/app.ts:31`  
**Issue:** `app.use(express.json())` uses Express's default 100kb limit. For a scouting API this is fine, but it should be explicit so future developers don't accidentally add an endpoint that expects large payloads without adjustment.

```typescript
app.use(express.json({ limit: "50kb" }));
```

---

### LO-04: Long-Lived JWT (7 Days) With No Refresh Token

**File:** `backend/src/routes/auth.ts:60-64, 91-95`  
**Issue:** Tokens expire after 7 days with no refresh token mechanism. A stolen token is valid for up to 7 days with no way to revoke it short of changing `JWT_SECRET` (which invalidates all sessions). Consider shorter expiry (1h) with a refresh token flow, or at minimum add a `jti` claim and a token revocation table.

---

### LO-05: Inconsistent Error Message Language

**Files:**  
- `backend/src/routes/teams.ts:14, 49` — `"Internal server error"` (English)  
- `backend/src/routes/analytics.ts:165, 206` — `"Internal server error"` (English)  
- `backend/src/routes/players.ts:132` — `"Internal server error"` (English)  
- All other routes — `"Error interno del servidor"` (Spanish)  

**Fix:** Standardize to Spanish: `"Error interno del servidor"`.

---

_Reviewed: 2026-04-20_  
_Reviewer: Claude (code-reviewer)_  
_Depth: standard_
