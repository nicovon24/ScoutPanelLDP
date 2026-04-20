# Code review: LDP-challenge frontend (modularization + compare/detail stats)

**Scope:** `frontend/src/lib/playerStats.ts`, `components/compare/PlayerSearch.tsx`, `components/player/{DonutCircle,PlayerCard,PlayerStatsTable}.tsx`, `app/(routes)/(dashboard)/compare/page.tsx`, `app/(routes)/(dashboard)/players/[id]/page.tsx`, `types/index.ts`, plus brief context from `lib/utils.ts`, `lib/radarNorm.ts`, `hooks/useShortlist.ts`.

**Method:** Static read of listed files; no runtime tests. Line numbers refer to the workspace snapshot at review time.

---

## 1. Executive summary

The modular split (`playerStats`, shared `PlayerStatsTable`, `types`) is directionally sound and the compare page correctly reuses `getCompareColsStyle` for header/heatmap/radar grids. However, **`buildValueHistory` synthesizes monthly “market value” points with a sine wave**, which is a serious correctness problem for any user-facing chart. There are **multiple API/type field mismatches** (`career` vs `careerHistory`, `contractUntil` vs `contractEnd`, injuries `startedAt`/`injuryType` vs `startDate`/`description`) that risk empty UI or wrong logic depending on the real payload. The compare view can also **desynchronize column templates** when there are three slots but only two loaded players, and **`PlayerStatsTable`’s section filter can ignore `onlySections` for the “Portería” block** because that branch runs before the `onlySections` check.

---

## 2. Findings table

| ID | Severity | File:line (approx.) | Title | Description | Recommendation |
|----|----------|---------------------|-------|-------------|----------------|
| F-01 | **HIGH** | `frontend/src/lib/playerStats.ts` **117–122** | Monthly market value is fabricated | `buildValueHistory` in `mode === "month"` sets `value: targetVal + Math.sin(i) * 0.05 * targetVal` and marks future months with `future`. This is not derived from stored history; it will mislead scouts and breaks trust in the chart. | Replace with real monthly series from the API (or hide monthly mode until data exists). If placeholder is unavoidable in dev, gate behind `NODE_ENV === 'development'` and show a clear “demo data” label. |
| F-02 | **HIGH** | `frontend/src/app/(routes)/(dashboard)/compare/page.tsx` **113–114**, **291–337** | Compare grid columns can disagree between sections | `contentCols` / `headerCols` use `getCompareColsStyle(slotCount)` where `slotCount = slots.length` (often **3**). `PlayerStatsTable` builds its own grid from `entries.length` (`validIndices.length`, often **2** when one slot is empty). Section headers and heatmaps use **3** player columns; the stats tables use **2** → misaligned rows vs header. | Drive `PlayerStatsTable` column count from `slots.length` (pass null placeholders / empty stats for empty slots) **or** pass `slotCount` into the table and pad `entries` to match header columns. |
| F-03 | **MEDIUM** | `frontend/src/types/index.ts` **45–75** vs `players/[id]/page.tsx` **100–108**, **105**, **444–449**; `playerStats.ts` **42–48**, **67–72** | Types and runtime fields diverge | `Player` declares `careerHistory`, `contractEnd`, injuries with `startDate`/`description`; the page uses `player.career`, `player.contractUntil`, `inj.injuryType`/`inj.startedAt`. `buildRatingHistory` reads `inj.startedAt`. If the API matches `types`, UI and injury overlays silently break; if the API matches the page, `types` are wrong and TS gives false confidence. | Align `Player` (and `SearchHit` if needed) with the API contract; use one canonical name per field. Add a thin mapper from API DTO → UI model if names differ. |
| F-04 | **MEDIUM** | `frontend/src/components/player/PlayerStatsTable.tsx` **201–208** | `onlySections` bypassed for “Portería” | Filter order: special-case `sec.label === "Portería"` returns GK-only **before** `if (onlySections) return onlySections.includes(sec.label)`. Compare uses `onlySections={["Info General"]}` (**291–297**): for a GK, “Portería” can still appear even though it is not in `onlySections`. | Evaluate `onlySections` / `excludeSections` first, or combine: e.g. `if (onlySections && !onlySections.includes(sec.label)) return false` before other rules (keeping GK logic inside the Portería branch only when that section is requested). |
| F-05 | **MEDIUM** | `frontend/src/components/player/PlayerCard.tsx` **56–59**, **155–196** | Card stats use `stats[0]`, not selected season | `const stat = player.stats?.[0]` assumes index 0 is the intended season; home grid / API order may not match “latest season” (detail page sorts by `season.year`). Users can see inconsistent numbers between card and detail. | Mirror detail logic: sort by `season?.year` descending and take `[0]`, or pass `defaultStat` from parent if the API guarantees order (document that invariant). |
| F-06 | **MEDIUM** | `frontend/src/components/compare/PlayerSearch.tsx` **24–28** | API failures are silent | `catch { setRes([]); }` clears results with no toast/message; users cannot tell “no matches” from “network error”. | Surface error state (banner or inline text), optional retry; at minimum `console.warn` with request id in dev. |
| F-07 | **MEDIUM** | `frontend/src/app/(routes)/(dashboard)/compare/page.tsx` **80–86** | Stale-closure risk on slot/player sync | `useEffect` depends only on `[slots]` with eslint-disable for `fetchPlayer` / `playersData`. In edge races (rapid slot changes), in-flight responses could write to wrong indices if not aborted/checked (classic stale `idx`). **Confidence: medium** — mitigated if responses always include player id check before `setPlayersData`. | Re-include stable deps with a ref for “latest request id per slot”, or compare `id` in the response handler before applying `o[idx] = data`. |
| F-08 | **LOW** | `frontend/src/lib/playerStats.ts` **19–27**, **33–35**, **86–90**; `PlayerStatsTable.tsx` **7–9**; `compare/page.tsx` **56–58**, **104–108**; `players/[id]/page.tsx` **43** | Widespread `any` on domain objects | `buildRatingHistory`/`buildValueHistory` take `player: any`; `PlayerEntry` uses `any`; compare page uses `any[]` for `playersData` / `getStat`. Hides the field mismatches in F-03 until runtime. | Type `player` as `Player` (extended with `ratings` shape including `seasonId` if real), narrow `stat` to `PlayerStat` + index access helpers. |
| F-09 | **LOW** | `frontend/src/lib/playerStats.ts` **33–52** vs **24–27** | Year vs month rating paths inconsistent with `selSeasonId` | Monthly path filters `ratingSource` by `selSeasonId`; yearly aggregation iterates **all** `(player.ratings ?? [])` without that filter. Season filter may not mean the same in both modes. | Apply the same season filter in year mode, or document that “year” is career-wide while “month” is season-scoped (and reflect in UI copy). |
| F-10 | **LOW** | `frontend/src/components/player/DonutCircle.tsx` **1–32** | Chart semantics + a11y | Non-GK “Rating” donut on the detail page uses `sofascoreRating * 10` (**271** in `page.tsx`) — a design choice, not a true percentage. SVG ring has no `aria-label` / `role="img"`. | Add `aria-label={`${label}: ${pct}%`}` (or expose `aria-labelledby`). Consider labeling as “score ×10” in UI if that is the intent. |
| F-11 | **INFO** | `frontend/src/app/(routes)/(dashboard)/players/[id]/page.tsx` **59–60** | `console.error` on fetch failure | Acceptable for dev; may be noisy or leak details in production consoles. | Route through a small logger or user-visible error component for production. |
| F-12 | **INFO** | `frontend/src/components/compare/PlayerSearch.tsx` **56–62** | Search input a11y | Relies on `placeholder` only; no `aria-label` / `aria-autocomplete`. | Add `aria-label="Buscar jugador"` (or `aria-labelledby`), `role="combobox"` if you model it as a listbox pattern. |
| F-13 | **INFO** | `frontend/src/types/index.ts` **69** | `ratings` type omits `seasonId` | Code filters `r.seasonId === selSeasonId` in `playerStats.ts` (**25–26**). | Extend rating entry type with optional `seasonId?: number`. |

---

## 3. Positive observations

- **`radarNorm.ts`** centralizes metric keys and scaling; `buildSingleRadar` / `buildMultiRadar` are easy to audit and reuse (**35–58**).
- **Compare page** uses dynamic imports for heavy chart/heatmap components with skeletons (**9–16**), which is a solid pattern for bundle size.
- **`PLAYER_COLORS` + `getCompareColsStyle`** align the intended grid math between compare chrome and `PlayerStatsTable` export (**296–301** in `PlayerStatsTable.tsx`, **113** in compare page) when slot count matches entry count.
- **`useShortlist`** documents race and retry concerns and uses `pendingIds` + conditional `setShortlistFetched` (**32–46**, **54–71**) — thoughtful compared to naive hooks.
- **`fmtNum` / `asNum`** (**126–135** in `playerStats.ts`) give predictable display for the stats table and avoid throwing on bad strings.
- **`reorderSections` / `SECTION_ORDER`** (**194–220**) are clear and keep position-aware ordering in one place.

---

## 4. Optional follow-up checklist

- [ ] Confirm real API JSON for `injuries`, `career`/`careerHistory`, and `contract*` fields; update `types/index.ts` and `buildRatingHistory` together.
- [ ] Remove or replace synthetic `Math.sin` monthly valuations (**F-01**).
- [ ] Fix compare layout for “3 slots, 2 players” (**F-02**) and add a visual regression test or Storybook state for that configuration.
- [ ] Fix `PlayerStatsTable` filter ordering for `onlySections` + GK (**F-04**).
- [ ] Align `PlayerCard` default stat row with sorted “latest season” (**F-05**).
- [ ] Reduce `any` on `player`/`stat` in `playerStats.ts` and compare/detail pages (**F-08**).
- [ ] Add minimal error UI for search and compare `api.get` failures (**F-06**, seasons load **62–65** on compare page already swallows errors similarly).

---

_Reviewer: Claude (GSD-style review). Evidence from repository files only._
