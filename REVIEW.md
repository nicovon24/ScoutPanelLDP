---
phase: frontend-review
reviewed: 2026-04-19T00:00:00Z
depth: deep
files_reviewed: 12
files_reviewed_list:
  - frontend/src/store/useScoutStore.ts
  - frontend/src/app/(routes)/(dashboard)/layout.tsx
  - frontend/src/components/layout/Sidebar.tsx
  - frontend/src/components/layout/Topbar.tsx
  - frontend/src/app/(routes)/login/page.tsx
  - frontend/src/app/(routes)/register/page.tsx
  - frontend/src/app/(routes)/(dashboard)/page.tsx
  - frontend/src/app/(routes)/(dashboard)/compare/page.tsx
  - frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx
  - frontend/src/components/player/PlayerStatsTable.tsx
  - frontend/src/components/player/PlayerCard.tsx
  - frontend/src/hooks/useShortlist.ts
  - frontend/src/lib/api.ts
findings:
  critical: 5
  warning: 6
  info: 6
  total: 17
status: issues_found
---

# Frontend Code Review — ScoutPanel LDP

**Reviewed:** 2026-04-19  
**Depth:** deep (cross-file analysis)  
**Files Reviewed:** 13  
**Status:** issues_found

---

## Summary

The frontend is well-structured overall: the Zustand store is clean, auth flow is logically sound, and the component breakdown is sensible. Mobile-responsiveness additions look correct and functional.

**Key concerns found:**

1. A broken auth-state synchronisation between the Axios 401 interceptor and the Zustand store can leave users trapped in a post-expiry loop.
2. Several instances of fabricated/hardcoded data (market value chart, "Duelos" donut) are rendered as if they were real analytics.
3. Hardcoded demo credentials ship in production source.
4. A `useScoutStore.setState` direct call bypasses the store's guard actions, risking state corruption.
5. A handful of medium-severity issues around stale closures, unnecessary API calls on focus, and missing retry on shortlist fetch failure.

---

## 🔴 Critical Issues

### CR-01: 401 Interceptor Does Not Clear the Zustand Store — Auth Loop After Token Expiry

**File:** `frontend/src/lib/api.ts:26`  
**Issue:** When the server returns a `401`, the interceptor removes `"accessToken"` from `localStorage` and redirects to `/login`. However, it never calls `clearAuth()` from the Zustand store. Because Zustand's `persist` middleware has serialised `token` into `localStorage` under the `"scout-store"` key, on the very next page load the persisted token is rehydrated back into state. The dashboard layout then sees `token !== null` and renders protected content again. The user is stuck in a loop: every API call returns 401, re-triggering the redirect, yet the store always rehydrates the expired token.

**Fix:**

```typescript
// frontend/src/lib/api.ts
import { useScoutStore } from "@/store/useScoutStore";

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        // Clear BOTH localStorage key AND Zustand persisted state
        useScoutStore.getState().clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

### CR-02: Hardcoded Demo Credentials in Login Page Source

**File:** `frontend/src/app/(routes)/login/page.tsx:13-14`  
**Issue:** The login form is initialised with real-looking demo credentials directly in component state:

```tsx
const [email, setEmail] = useState("demo@gmail.com");
const [password, setPassword] = useState("123456");
```

These values ship to every client, exposing valid credentials in the compiled bundle and making it trivial for anyone to inspect the source and log in.

**Fix:** Remove the pre-filled defaults. If a demo account is intentional for graders/reviewers, document it externally (e.g., `README.md`) rather than embedding in source.

```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
```

---

### CR-03: `useScoutStore.setState` Bypasses Store Guards — Compare List State Corruption

**File:** `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:339`  
**Issue:** The "Comparar" button fires a raw `setState` call that unconditionally replaces `compareList`:

```tsx
useScoutStore.setState({ compareList: [player] });
```

This bypasses `addToCompare`, which enforces the 3-player maximum and deduplication guard. It also bypasses `addShortlistId` hooks. If the user is mid-comparison with 2 players already loaded, clicking "Comparar" on a detail page silently wipes them. Using the internal action also ensures future invariants added to `addToCompare` apply everywhere.

**Fix:**

```tsx
onClick={() => {
  useScoutStore.getState().clearCompare();
  useScoutStore.getState().addToCompare(player);
  router.push('/compare');
}}
```

---

### CR-04: Market Value Chart Displays Fabricated Sinusoidal Data as Real Analytics

**File:** `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:191-196`  
**Issue:** In "monthly" mode the market value history is generated with artificial noise:

```tsx
value: targetVal + (Math.sin(i) * 0.05 * targetVal),
```

Every data point is a deterministic sine wave offset from a single value. The chart renders this as a live trend line, but no actual historical market value data is being used. A scout or analyst relying on this chart would be misled.

**Fix:** Remove the artificial variation. If monthly granularity data does not exist, render the chart flat or hide it until real data is available:

```tsx
value: targetVal,  // flat — honest when no monthly data exists
```

Or conditionally render the chart only in `"year"` mode (where real per-season data is used).

---

### CR-05: Hardcoded `68` for Non-GK "Duelos" Donut — Fabricated Metric

**File:** `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx:407`  
**Issue:** The sixth "Rendimiento Técnico" donut always shows `68%` for non-GK players:

```tsx
value={player.position === "GK" ? parseFloat(curStat.savePct ?? "0") : 68}
label={player.position === "GK" ? "Paradas" : "Duelos"}
```

The number `68` is not derived from any stat; it is a placeholder that was never replaced with real data (e.g., `aerialDuelsWonPct`, `duelsWonPct`, or similar).

**Fix:** Replace with a real stat or remove the donut entirely:

```tsx
<DonutCircle
  value={parseFloat(curStat.aerialDuelsWonPct ?? "0")}
  label={player.position === "GK" ? "Paradas" : "Duelos aéreos"}
  color="var(--blue)"
/>
```

---

## 🟡 Medium Issues

### WR-01: `searchParams` Imported and Destructured but Never Used

**File:** `frontend/src/app/(routes)/(dashboard)/page.tsx:3,18`  
**Issue:** `useSearchParams` is imported and `searchParams` is read from the hook at line 18, but the variable is never referenced anywhere in `HomeContent`. This adds an unnecessary hook call and an unnecessary `<Suspense>` boundary wrapper around the entire page.

**Fix:** Remove the import and the destructured variable:

```tsx
// Remove this line:
import { useSearchParams } from "next/navigation";

// Remove this from the component body:
const searchParams = useSearchParams();
```

If `searchParams` is not used, also evaluate whether the `<Suspense>` wrapper in `HomePage` is still necessary — it was required because of `useSearchParams`.

---

### WR-02: Shortlist Fetch Failure Permanently Suppresses Retry Without Page Reload

**File:** `frontend/src/hooks/useShortlist.ts:47-50`  
**Issue:** When the `/shortlist/ids` API call fails (network error, temporary server issue), `setShortlistFetched(true)` is still called:

```tsx
.catch(() => {
  setShortlistFetched(true);  // prevents any future retry
});
```

Because `shortlistFetched` gates the `useEffect`, the shortlist will never be fetched again in the current session, even if the error was transient. The user's favorites appear empty for the entire session.

**Fix:** On non-auth errors, keep `shortlistFetched` false to allow a future retry trigger, or implement a retry with exponential backoff:

```tsx
.catch((e) => {
  // Only mark as fetched if it's an auth error (401); otherwise allow retry
  if (e.response?.status === 401) {
    setShortlistFetched(true);
  }
  // For transient errors, leave shortlistFetched = false so next mount retries
});
```

---

### WR-03: `onFocus` on Search Input Triggers API Call With Empty String on Every Focus

**File:** `frontend/src/app/(routes)/(dashboard)/compare/page.tsx:76`  
**Issue:** The search input's `onFocus` handler unconditionally calls `fetch("")` when there is no query and no cached results:

```tsx
onFocus={() => { if (!q && !results.length) fetch(""); else setOpen(true); }}
```

An empty-string search fetches and caches all players (or the first page). This fires every time the user clicks into an empty search box, causing unnecessary API calls. The variable `fetch` also shadows the global `window.fetch`.

**Fix:** Remove the auto-fetch on focus (the debounced search effect handles it once the user types), and rename the function to avoid shadowing:

```tsx
const fetchPlayers = useCallback(async (val: string) => {
  if (!val.trim()) return;   // don't search empty string
  // ...
}, [excludeIds]);

// Input:
onFocus={() => { if (results.length) setOpen(true); }}
```

---

### WR-04: `updateFiltersAndStore` Not Memoised but Called Inside `useEffect` Without Being in Dependencies

**File:** `frontend/src/app/(routes)/(dashboard)/page.tsx:64-83`  
**Issue:** `updateFiltersAndStore` is defined as a plain function inside the component body (not wrapped in `useCallback`). It is called inside the debounced `useEffect` at line 77, but the effect only lists `[inputQ]` as its dependency — not the function itself. This is a stale closure: if `_hasHydrated` or `setSearchFilters` changes between renders, the version of `updateFiltersAndStore` captured by the effect may be stale.

**Fix:** Either wrap `updateFiltersAndStore` in `useCallback` and add it to the effect's dependency array, or inline the logic:

```tsx
const updateFiltersAndStore = useCallback((updates: Partial<typeof filters>) => {
  if (!_hasHydrated) return;
  setFilters(prev => {
    const n = { ...prev, ...updates };
    setSearchFilters(n);
    return n;
  });
  setPage(1);
}, [_hasHydrated, setSearchFilters]);

useEffect(() => {
  if (!_hasHydrated) return;
  const t = setTimeout(() => {
    if (inputQ !== filters.q) updateFiltersAndStore({ q: inputQ });
  }, 500);
  return () => clearTimeout(t);
}, [inputQ, _hasHydrated, filters.q, updateFiltersAndStore]);
```

---

### WR-05: `calcAge` Returns `NaN` for Invalid Date Strings

**File:** `frontend/src/components/player/PlayerCard.tsx:55-58`, also `players/[id]/page.tsx:19-22`  
**Issue:** Both `calcAge` implementations do not guard against malformed date strings:

```tsx
function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}
```

If `dob` is a non-empty invalid string (e.g., `"N/A"`, `"unknown"`), `new Date(dob).getTime()` returns `NaN`, and `Math.floor(NaN)` is `NaN`. `PlayerCard` then renders `"NaN años"` in the UI.

**Fix:** Add a `NaN` guard:

```tsx
function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24 * 365.25));
}
```

And in `PlayerCard` guard the render:

```tsx
{age != null && <span className="text-xs text-primary/50 font-medium">{age} años</span>}
```

---

### WR-06: `addFavorite` / `removeFavorite` Have No Loading State — Double-Click Race Condition

**File:** `frontend/src/hooks/useShortlist.ts:58-88`  
**Issue:** Both `addFavorite` and `removeFavorite` fire async API calls but expose no `isLoading` state. A user who clicks the star icon twice quickly will send two concurrent POST/DELETE requests. The store is updated optimistically after each one (`addShortlistId` / `removeShortlistId`), so the final state depends on which response settles last — the favorite could end up toggled incorrectly.

**Fix:** Expose an `isLoading` flag, or use a local `useRef` guard inside each function:

```tsx
const pendingRef = useRef(false);

const addFavorite = useCallback(async (player: ShortlistPlayer) => {
  if (token) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      await api.post(`/shortlist/${player.id}`);
      addShortlistId(player.id);
    } catch (e) {
      console.error("Error agregando a shortlist", e);
    } finally {
      pendingRef.current = false;
    }
  } else {
    localAdd(player);
  }
}, [token, addShortlistId, localAdd]);
```

---

## 🟢 Info / Low Priority

### IN-01: `DEFAULT_FILTERS` Duplicated Between Store and Home Page

**Files:** `frontend/src/store/useScoutStore.ts:28-40`, `frontend/src/app/(routes)/(dashboard)/page.tsx:29-41`  
**Issue:** The identical `DEFAULT_FILTERS` object is defined in two places. Changes to filter defaults must be made in both locations and can drift out of sync.

**Fix:** Export `DEFAULT_FILTERS` from the store and import it in the page.

---

### IN-02: Heavy `any` Usage in Home and Compare Pages

**Files:** `frontend/src/app/(routes)/(dashboard)/page.tsx:22-23`, `frontend/src/app/(routes)/(dashboard)/compare/page.tsx:129,131`  
**Issue:** `useState<any[]>([])` for `players` and `teams`, and `useState<(any | null)[]>` for `playersData` lose TypeScript's type-safety benefits. Errors like accessing undefined fields or passing wrong types go undetected.

**Fix:** Define minimal interfaces or reuse existing types from the shared store/hook:

```tsx
interface PlayerSummary {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  // ...
}
const [players, setPlayers] = useState<PlayerSummary[]>([]);
```

---

### IN-03: `calcAge` Function Duplicated Across Four Files

**Files:** `compare/page.tsx:15-22`, `players/[id]/page.tsx:19-22`, `PlayerCard.tsx:55-58`, `PlayerStatsTable.tsx:48-56`  
**Issue:** The same date-to-age conversion logic (including edge case handling) is copy-pasted in four different files. Any bug fix or improvement needs to be applied in four places.

**Fix:** Extract to a shared utility:

```tsx
// frontend/src/lib/utils.ts
export function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24 * 365.25));
}
```

---

### IN-04: Sidebar Nav Badge Uses Fragile String Comparison

**File:** `frontend/src/components/layout/Sidebar.tsx:105,114`  
**Issue:** Badges are conditionally shown by matching the nav item's `label` string:

```tsx
{label === "Comparar" && compareList.length > 0 && (...)}
{label === "Favoritos" && favCount > 0 && (...)}
```

If the label is ever changed (e.g., translated or renamed), the badge silently disappears.

**Fix:** Add an optional `badge` field to `NAV_ITEMS`:

```tsx
const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/compare", icon: BarChart2, label: "Comparar", badgeKey: "compare" as const },
  { href: "/favorites", icon: Star, label: "Favoritos", badgeKey: "favorites" as const },
];
```

---

### IN-05: Radar Chart Normalisation Magic Numbers Duplicated

**Files:** `compare/page.tsx:418-430`, `players/[id]/page.tsx:203-215`  
**Issue:** The same arbitrary normalisation multipliers (`* 5`, `* 100`, `* 8`, `* 35`, `* 11`, etc.) appear verbatim in both the compare page and the detail page. These numbers are undocumented and any change to the radar metric scale requires updating two locations.

**Fix:** Extract to a shared constant or factory function:

```tsx
// frontend/src/lib/radarMetrics.ts
export function buildRadarData(stat: PlayerStat) {
  const n = (v: any) => { const f = parseFloat(String(v ?? "0")); return isNaN(f) ? 0 : f; };
  return [
    { metric: "Goles",       playerA: Math.min(100, n(stat.goals) * 5) },
    // ...
  ];
}
```

---

### IN-06: Numeric Indices Used as `key` in List Rendering

**Files:** `frontend/src/components/player/PlayerStatsTable.tsx:285,292,397,398`  
**Issue:** Several `map` calls use the array index as the React `key` (e.g., `key={sIdx}`, `key={rIdx}`). This is safe here because the section/row lists are static constants, but it becomes fragile if sections are ever reordered dynamically.

**Fix:** Use stable identifiers where available (section label, stat key):

```tsx
{sections.map((sec) => (
  <div key={sec.label}>
    ...
    {sec.rows.map((r) => (
      <SingleStatRow key={r.l} ... />
    ))}
  </div>
))}
```

---

_Reviewed: 2026-04-19_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
