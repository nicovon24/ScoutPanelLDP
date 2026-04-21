"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { SlidersHorizontal, LayoutGrid, List, Search, X } from "lucide-react";
import api from "@/lib/api";
import { useScoutStore, DEFAULT_FILTERS } from "@/store/useScoutStore";
import type { Player, Team } from "@/types";
import { Select, SelectItem, Input, type Selection } from "@nextui-org/react";
import AppButton from "@/components/ui/AppButton";
import { sharedSelectClasses, sharedSelectItemClasses, searchFieldInputClassNames } from "@/components/ui/sharedStyles";

// Components
import PlayerGrid from "@/components/home/PlayerGrid";
import PlayerTable from "@/components/home/PlayerTable";
import FilterSidebar, { POSITIONS_LIST } from "@/components/home/FilterSidebar";
import Pagination from "@/components/home/Pagination";
import SortSelect from "@/components/home/SortSelect";

function HomeContent() {
  const { setFilterPanelOpen, pageSize, setPageSize, searchFilters, setSearchFilters, _hasHydrated } = useScoutStore();

  // Filters derived from the store — single source of truth for the fetch
  const filters = { ...DEFAULT_FILTERS, ...(searchFilters ?? {}) };

  // Data State
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [view, setView] = useState<"grid" | "table">("grid");

  // inputQ is local-only for debounce — kept in sync with store
  const [inputQ, setInputQ] = useState(searchFilters?.q ?? "");

  // Keep inputQ in sync if store changes externally (e.g. reset)
  useEffect(() => {
    setInputQ(searchFilters?.q ?? "");
  }, [searchFilters?.q]);

  // setSearchFilters already merges with existing state in the store
  const updateFiltersAndStore = useCallback((updates: Partial<typeof DEFAULT_FILTERS>) => {
    if (!_hasHydrated) return;
    setSearchFilters(updates);
    setPage(1);
  }, [_hasHydrated, setSearchFilters]);

  // Debounced search — only passes the changed field, no stale closure risk
  useEffect(() => {
    if (!_hasHydrated) return;
    const t = setTimeout(() => {
      setSearchFilters({ q: inputQ });
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [inputQ, _hasHydrated, setSearchFilters]);

  // Initial load
  useEffect(() => {
    api.get("/teams").then(({ data }) => setTeams(data)).catch(() => { });
  }, []);

  // fetchPlayers reads searchFilters from the store — always up-to-date after hydration
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const f = { ...DEFAULT_FILTERS, ...(searchFilters ?? {}) };
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (f.q) params.set("q", f.q);
    if (f.position) params.set("position", f.position);
    if (f.teamId) params.set("teamId", f.teamId);
    if (f.ageMin) params.set("ageMin", f.ageMin);
    if (f.ageMax) params.set("ageMax", f.ageMax);
    if (f.minRating) params.set("minRating", f.minRating);
    if (f.marketValueMin) params.set("valueMin", f.marketValueMin);
    if (f.marketValueMax) params.set("valueMax", f.marketValueMax);
    if (f.nationality) params.set("nationality", f.nationality);
    if (f.contractType) params.set("contractType", f.contractType);
    if (f.sortBy) params.set("sortBy", f.sortBy);

    try {
      const { data } = await api.get(`/players?${params}`);
      setPlayers(data.items || []);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchFilters, pageSize]);

  // Only fetch after store is hydrated — searchFilters already has persisted values at this point
  useEffect(() => {
    if (_hasHydrated) fetchPlayers();
  }, [fetchPlayers, _hasHydrated]);

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "sortBy") return false;
    if (key === "minRating" && val === "6.0") return false;
    return val !== "" && val !== undefined && val !== null;
  }).length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-5 sm:space-y-7 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight leading-none">Explorar Jugadores</h1>
          <p className="text-secondary mt-2 sm:mt-3 text-sm sm:text-base font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse flex-shrink-0" />
            {loading ? "Buscando talentos..." : `${totalItems.toLocaleString()} talentos • Apertura 2026`}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="flex p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden">
            <AppButton
              type="button"
              isIconOnly
              variant="light"
              disableRipple
              onPress={() => setView("grid")}
              className={`min-w-9 w-9 h-9 sm:w-10 sm:h-10 sm:min-w-10 rounded-lg transition-all ${view === "grid" ? "bg-white/10 text-primary shadow-sm" : "text-muted"}`}
              aria-label="Vista grilla"
            >
              <LayoutGrid size={16} />
            </AppButton>
            <AppButton
              type="button"
              isIconOnly
              variant="light"
              disableRipple
              onPress={() => setView("table")}
              className={`min-w-9 w-9 h-9 sm:w-10 sm:h-10 sm:min-w-10 rounded-lg transition-all ${view === "table" ? "bg-white/10 text-primary shadow-sm" : "text-muted"}`}
              aria-label="Vista tabla"
            >
              <List size={16} />
            </AppButton>
          </div>

          {activeFilterCount > 0 && (
            <AppButton
              type="button"
              isIconOnly
              variant="light"
              disableRipple
              onPress={() => {
                const resetState = {
                  q: "", position: "", teamId: "",
                  ageMin: "", ageMax: "",
                  minRating: "6.0", marketValueMin: "", marketValueMax: "",
                  nationality: "", contractType: "", sortBy: "rating_desc"
                };
                updateFiltersAndStore(resetState);
                setInputQ("");
              }}
              className="h-9 w-9 min-w-9 sm:h-11 sm:w-11 sm:min-w-11 rounded-xl bg-[#e05a5a]/10 text-[#e05a5a] border border-[#e05a5a]/25 hover:bg-[#e05a5a]/20"
              aria-label="Limpiar filtros"
            >
              <X size={16} strokeWidth={2.5} />
            </AppButton>
          )}

          <AppButton
            onClick={() => setFilterPanelOpen(true)}
            variant={activeFilterCount > 0 ? "primary" : "secondary"}
            className="h-9 sm:h-11 px-3 sm:px-5 gap-1.5 sm:gap-2 text-sm"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden xs:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-lg bg-mainBg text-green text-xs font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </AppButton>
        </div>
      </div>

      {/* ── Search & Quick Bar ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-5 sm:gap-6 bg-white/[0.02] border border-white/[0.05] p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[340px]">
          <Input
            label="Buscar jugadores"
            labelPlacement="outside"
            value={inputQ}
            onChange={(e) => { setInputQ(e.target.value); setPage(1); }}
            placeholder="Nombre, club…"
            startContent={<Search size={16} className="text-muted flex-shrink-0 pl-0.5" />}
            endContent={
              inputQ ? (
                <AppButton
                  type="button"
                  isIconOnly
                  variant="light"
                  radius="full"
                  className="min-w-8 w-8 h-8 text-secondary"
                  onPress={() => { setInputQ(""); setPage(1); }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </AppButton>
              ) : null
            }
            variant="flat"
            classNames={{
              ...searchFieldInputClassNames,
              inputWrapper:
                "h-12 min-h-12 bg-card border border-white/10 rounded-xl pl-3.5 pr-1 group-data-[focus=true]:border-green/45 group-data-[focus=true]:shadow-[0_0_20px_rgba(0,224,148,0.1)]",
              input: "text-sm sm:text-base text-primary placeholder:text-secondary pl-0.5",
            }}
          />
        </div>

        {/* Quick Position Multi-Select */}
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[260px] hidden sm:block">
          <Select
            selectionMode="multiple"
            items={POSITIONS_LIST}
            placeholder="Filtrar posiciones"
            selectedKeys={filters.position ? new Set(filters.position.split(",")) : new Set()}
            onSelectionChange={(keys: Selection) => {
              const arr = Array.from(keys).join(",");
              updateFiltersAndStore({ position: arr });
            }}
            renderValue={(items) => {
              if (items.length === 0) return null;
              if (items.length === 1) return (
                <span className="text-primary font-bold text-sm truncate">{items[0].key}</span>
              );
              return (
                <span className="text-primary font-bold text-sm whitespace-nowrap">
                  {items.map(i => i.key).join(", ")}
                </span>
              );
            }}
            classNames={{
              trigger: `${sharedSelectClasses.trigger} h-12 min-w-0`,
              value: "text-secondary font-bold text-sm min-w-0 overflow-hidden",
              popoverContent: sharedSelectClasses.popoverContent,
            }}
            aria-label="Filtro rápido de posiciones"
          >
            {(item) => (
              <SelectItem
                key={item.id}
                textValue={item.id}
                classNames={sharedSelectItemClasses}
              >
                <div className="flex gap-2 items-center">
                  <span className="text-green font-black w-8">{item.id}</span>
                  <span className="text-xs">{item.name.replace(item.id + " - ", "")}</span>
                </div>
              </SelectItem>
            )}
          </Select>
        </div>

        {/* Sort Selector */}
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[280px] ml-0 lg:ml-auto">
          <SortSelect
            value={filters.sortBy}
            onChange={(sortBy) => updateFiltersAndStore({ sortBy })}
          />
        </div>
      </div>

      {/* ── Active Filters Chips ── */}
      {_hasHydrated && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-[-8px]">
          <span className="text-2xs font-black text-muted uppercase tracking-[0.15em] mr-2">Filtros activos:</span>
          
          {filters.position && filters.position.split(",").map(pos => (
            <div key={pos} className="flex items-center gap-1.5 bg-[#34d35a]/10 border border-[#34d35a]/20 px-2 py-1 rounded-lg">
              <span className="text-2xs font-black text-green uppercase">{pos}</span>
              <button onClick={() => {
                const arr = filters.position.split(",").filter(p => p !== pos);
                updateFiltersAndStore({ position: arr.join(",") });
              }} className="text-green/60 hover:text-green"><X size={10} strokeWidth={3} /></button>
            </div>
          ))}

          {filters.teamId && filters.teamId.split(",").map(tid => {
            const teamName = teams.find(t => t.id?.toString() === tid)?.name || "Club";
            return (
              <div key={tid} className="flex items-center gap-1.5 bg-[#34d35a]/10 border border-[#34d35a]/20 px-2 py-1 rounded-lg">
                <span className="text-2xs font-black text-green uppercase">{teamName}</span>
                <button onClick={() => {
                  const arr = filters.teamId.split(",").filter(p => p !== tid);
                  updateFiltersAndStore({ teamId: arr.join(",") });
                }} className="text-green/60 hover:text-green"><X size={10} strokeWidth={3} /></button>
              </div>
            );
          })}

          {(filters.ageMin || filters.ageMax) && (
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg">
              <span className="text-2xs font-black text-purple-400 uppercase">Edad: {filters.ageMin || "0"}-{filters.ageMax || "50"}</span>
              <button onClick={() => updateFiltersAndStore({ ageMin: "", ageMax: "" })} className="text-purple-400/60 hover:text-purple-400"><X size={10} strokeWidth={3} /></button>
            </div>
          )}

          {(filters.marketValueMin || filters.marketValueMax) && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
              <span className="text-2xs font-black text-orange-400 uppercase">
                {filters.marketValueMin ? `${filters.marketValueMin}M€` : "0"} — {filters.marketValueMax ? `${filters.marketValueMax}M€` : "∞"}
              </span>
              <button onClick={() => updateFiltersAndStore({ marketValueMin: "", marketValueMax: "" })} className="text-orange-400/60 hover:text-orange-400"><X size={10} strokeWidth={3} /></button>
            </div>
          )}

          {filters.nationality && (
            <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
              <span className="text-2xs font-black text-cyan-400 uppercase">{filters.nationality}</span>
              <button onClick={() => updateFiltersAndStore({ nationality: "" })} className="text-cyan-400/60 hover:text-cyan-400"><X size={10} strokeWidth={3} /></button>
            </div>
          )}

          {filters.contractType && filters.contractType.split(",").map(ct => {
            const label = ct === "PERMANENT" ? "Permanente" : ct === "LOAN" ? "Préstamo" : "Libre";
            return (
              <div key={ct} className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
                <span className="text-2xs font-black text-violet-400 uppercase">{label}</span>
                <button onClick={() => {
                  const arr = filters.contractType.split(",").filter(v => v !== ct);
                  updateFiltersAndStore({ contractType: arr.join(",") });
                }} className="text-violet-400/60 hover:text-violet-400"><X size={10} strokeWidth={3} /></button>
              </div>
            );
          })}

          <button
            onClick={() => {
              const resetState = {
                q: "", position: "", teamId: "",
                ageMin: "", ageMax: "",
                minRating: "6.0", marketValueMin: "", marketValueMax: "",
                nationality: "", contractType: "", sortBy: "rating_desc"
              };
              updateFiltersAndStore(resetState);
              setInputQ("");
            }}
            className="text-2xs font-black text-danger uppercase tracking-[0.1em] hover:underline ml-2"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* ── Results Area ── */}
      <div className="min-h-[400px]">
        {!_hasHydrated ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-green/30 border-t-green rounded-full animate-spin" />
          </div>
        ) : view === "grid"
          ? <PlayerGrid players={players} loading={loading} />
          : <PlayerTable
            players={players}
            loading={loading}
            sortBy={filters.sortBy}
            onSort={(sort) => updateFiltersAndStore({ sortBy: sort })}
          />
        }
      </div>

      {/* ── Footer: Pagination & Limit ── */}
      {!loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base text-muted font-black uppercase tracking-widest">Mostrar:</span>
              <Select
                selectedKeys={[String(pageSize)]}
                onChange={(e) => { if (e.target.value) { setPageSize(Number(e.target.value)); setPage(1); } }}
                className="w-32"
                size="md"
                classNames={{
                  trigger: `${sharedSelectClasses.trigger} h-[42px]`,
                  value: sharedSelectClasses.value,
                  popoverContent: sharedSelectClasses.popoverContent,
                }}
                aria-label="Mostrar"
              >
                <SelectItem key="10" value="10" classNames={sharedSelectItemClasses}>10 items</SelectItem>
                <SelectItem key="20" value="20" classNames={sharedSelectItemClasses}>20 items</SelectItem>
                <SelectItem key="30" value="30" classNames={sharedSelectItemClasses}>30 items</SelectItem>
                <SelectItem key="40" value="40" classNames={sharedSelectItemClasses}>40 items</SelectItem>
                <SelectItem key="50" value="50" classNames={sharedSelectItemClasses}>50 items</SelectItem>
              </Select>
            </div>
            <span className="text-sm sm:text-base text-muted font-bold tracking-tight">
              {totalItems > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)}` : 0} de {totalItems}
            </span>
          </div>

          <Pagination
            current={page}
            total={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ── Sidebar Component ── */}
      <FilterSidebar
        teams={teams}
        filters={filters}
        setFilters={(n) => updateFiltersAndStore(n)}
        onReset={() => {
          const resetState = {
            q: "", position: "", teamId: "",
            ageMin: "", ageMax: "",
            minRating: "6.0", marketValueMin: "", marketValueMax: "",
            nationality: "", contractType: "", sortBy: "rating_desc"
          };
          updateFiltersAndStore(resetState);
          setInputQ("");
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-green/30 border-t-green rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
