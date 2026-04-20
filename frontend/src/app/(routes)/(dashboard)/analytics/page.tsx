"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Search, TrendingUp, X } from "lucide-react";

const PAGE_SIZE = 25;
import { Select, SelectItem } from "@nextui-org/react";
import api from "@/lib/api";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";
import { POSITION_GROUPS, POSITION_GROUP_KEYS } from "@/lib/analyticsConfig";
import LeagueTable from "@/components/analytics/LeagueTable";
import LeagueSummaryCards from "@/components/analytics/LeagueSummaryCards";
import ExportMenu from "@/components/analytics/ExportMenu";
import type {
  LeaderboardEntry,
  LeagueSummary,
  LeaderboardMetric,
  PositionGroup,
  Season,
} from "@/types";

// ── Position group tab ────────────────────────────────────────────────────────
function GroupTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider
                  transition-all whitespace-nowrap
                  ${active
          ? "bg-green/15 text-green border border-green/25 shadow-[0_0_12px_rgba(0,224,148,0.1)]"
          : "text-muted hover:text-secondary hover:bg-white/[0.03] border border-transparent"}`}
    >
      {label}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [seasons, setSeasons]               = useState<Season[]>([]);
  const [seasonId, setSeasonId]             = useState<string>("");
  const [posGroup, setPosGroup]             = useState<PositionGroup>("todos");
  const [metric, setMetric]                 = useState<LeaderboardMetric>("rating");
  const [sortDir, setSortDir]               = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery]       = useState("");
  const [entries, setEntries]               = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary]               = useState<LeagueSummary | null>(null);
  const [loadingTable, setLoadingTable]     = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [page, setPage]                     = useState(1);

  // ── Seasons ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/seasons").then(({ data }) => {
      setSeasons(data);
      if (data.length) setSeasonId(String(data[0].id));
    }).catch(() => {});
  }, []);

  // Derive season year for debut filter
  const selectedSeason = useMemo(
    () => seasons.find((s) => String(s.id) === seasonId),
    [seasons, seasonId],
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seasonId) return;
    setLoadingSummary(true);
    api.get("/analytics/summary", { params: { seasonId } })
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));
  }, [seasonId]);

  // ── Leaderboard ───────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(() => {
    if (!seasonId) return;
    const groupCfg  = POSITION_GROUPS[posGroup];
    const positions = groupCfg.positions.join(",") || undefined;

    setLoadingTable(true);
    api.get("/analytics/leaderboard", {
      params: {
        metric,
        seasonId,
        sortDir,
        ...(positions              ? { positions }                        : {}),
        ...(selectedSeason?.year   ? { debutYearMax: selectedSeason.year } : {}),
        limit: 500,
      },
    })
      .then(({ data }) => { setEntries(data); setPage(1); })
      .catch(() => setEntries([]))
      .finally(() => setLoadingTable(false));
  }, [seasonId, posGroup, metric, sortDir, selectedSeason]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ── Client-side search filter ─────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [searchQuery]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pagedEntries = useMemo(
    () => filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredEntries, page],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleGroupChange(group: PositionGroup) {
    setPosGroup(group);
    const defaultMetric = POSITION_GROUPS[group].defaultMetric;
    setMetric(defaultMetric);
    setSortDir(defaultMetric === "goalsConceded" ? "asc" : "desc");
    setSearchQuery("");
  }

  function handleSort(col: LeaderboardMetric) {
    if (col === metric) {
      // Toggle direction
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setMetric(col);
      setSortDir(col === "goalsConceded" ? "asc" : "desc");
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const groupCfg   = POSITION_GROUPS[posGroup];
  const seasonName = selectedSeason?.name ?? "";
  const activeColLabel = groupCfg.cols.find((c) => c.key === metric)?.label ?? metric;

  return (
    <div className="max-w-[1400px] mx-auto min-w-0 pb-16 pt-4 animate-fade-in space-y-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Estadísticas de Liga
          </p>
          <h1 className="text-xl font-black text-primary flex items-center gap-2">
            <TrendingUp size={18} className="text-green" />
            Rendimientos &amp; Reportes
          </h1>
        </div>

        {/* Season selector */}
        <div className="w-full sm:w-[180px]">
          <Select
            aria-label="Seleccionar temporada"
            placeholder="Temporada"
            selectedKeys={seasonId ? [seasonId] : []}
            onSelectionChange={(keys: any) => {
              const v = Array.from(keys)[0];
              if (v) setSeasonId(String(v));
            }}
            classNames={{
              trigger: `${sharedSelectClasses.trigger} h-[38px]`,
              value: sharedSelectClasses.value,
              popoverContent: sharedSelectClasses.popoverContent,
            }}
            startContent={<Calendar size={14} className="text-green" />}
          >
            {seasons.map((s) => (
              <SelectItem key={String(s.id)} textValue={s.name} classNames={sharedSelectItemClasses}>
                {s.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <LeagueSummaryCards
        summary={summary ?? { totalGoals: 0, totalAssists: 0, avgRating: 0, activePlayers: 0, totalMatches: 0 }}
        loading={loadingSummary}
      />

      {/* ── Leaderboard card ───────────────────────────────────────────────── */}
      <div className="card space-y-4 min-w-0">

        {/* Row 1: position tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {POSITION_GROUP_KEYS.map((g) => (
            <GroupTab
              key={g}
              label={POSITION_GROUPS[g].label}
              active={posGroup === g}
              onClick={() => handleGroupChange(g)}
            />
          ))}
        </div>

        {/* Row 2: search + metric badge + export */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar jugador…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-input border border-white/10 rounded-lg
                         text-sm text-primary placeholder:text-muted/50 font-medium
                         focus:outline-none focus:border-green/40 focus:bg-input/80 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Metric badge + sort dir */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-muted font-bold uppercase tracking-widest hidden sm:inline">Ordenado por:</span>
            <span className="font-black text-green bg-green/10 border border-green/20 px-2 py-1 rounded-md uppercase tracking-wider">
              {activeColLabel} {sortDir === "asc" ? "↑" : "↓"}
            </span>
          </div>

          {/* Export — usa el dataset completo sin paginar */}
          <ExportMenu
            entries={entries}
            cols={groupCfg.cols}
            group={posGroup}
            metric={metric}
            seasonName={seasonName}
            disabled={entries.length === 0}
          />
        </div>

        {/* Hint */}
        <p className="text-[10px] text-muted/50 font-medium -mt-1">
          Hacé clic en el encabezado de columna para ordenar · Clic doble alterna el orden
        </p>

        {/* Table */}
        <LeagueTable
          entries={pagedEntries}
          cols={groupCfg.cols}
          metric={metric}
          sortDir={sortDir}
          onSort={handleSort}
          loading={loadingTable}
          isFiltered={searchQuery.trim().length > 0}
        />

        {/* Pagination */}
        {!loadingTable && filteredEntries.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-muted font-medium">
              {filteredEntries.length} jugadores · página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                           text-muted hover:text-primary hover:border-white/20 disabled:opacity-30
                           disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="w-8 text-center text-muted text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border
                                  ${page === p
                          ? "bg-green/15 text-green border-green/25"
                          : "text-muted border-white/10 hover:text-primary hover:border-white/20"}`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                           text-muted hover:text-primary hover:border-white/20 disabled:opacity-30
                           disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
