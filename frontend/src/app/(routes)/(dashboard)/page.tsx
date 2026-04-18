"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, SlidersHorizontal, LayoutGrid, List, Search, X } from "lucide-react";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import { Select, SelectItem, Button, Input } from "@nextui-org/react";
import AppButton from "@/components/ui/AppButton";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";

// Components
import PlayerGrid from "@/components/home/PlayerGrid";
import PlayerTable from "@/components/home/PlayerTable";
import FilterSidebar, { POSITIONS_LIST } from "@/components/home/FilterSidebar";
import Pagination from "@/components/home/Pagination";

function HomeContent() {
  const searchParams = useSearchParams();
  const { setFilterPanelOpen, pageSize, setPageSize, searchFilters, setSearchFilters, _hasHydrated } = useScoutStore();

  // Data State
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "table">("grid");

  const DEFAULT_FILTERS = {
    q: "",
    position: "",
    teamId: "",
    foot: "",
    ageMin: "",
    ageMax: "",
    heightMin: "",
    heightMax: "",
    minRating: "6.0",
    marketValueMax: "",
    sortBy: "rating_desc",
  };
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [inputQ, setInputQ] = useState("");

  // When Store Hydration finishes, sync local state
  useEffect(() => {
    if (_hasHydrated && searchFilters) {
      setFilters(searchFilters);
      setInputQ(searchFilters.q || "");
    }
  }, [_hasHydrated]);

  // Sync back to local if Store changes later (e.g. from Sidebar)
  useEffect(() => {
    if (_hasHydrated && searchFilters) {
      setFilters(searchFilters);
      if (searchFilters.q !== inputQ) {
        setInputQ(searchFilters.q);
      }
    }
  }, [searchFilters]);

  const updateFiltersAndStore = (updates: any) => {
    if (!_hasHydrated) return;
    setFilters(prev => {
      const n = { ...prev, ...updates };
      setSearchFilters(n);
      return n;
    });
    setPage(1);
  };

  // Debounced search
  useEffect(() => {
    if (!_hasHydrated) return;
    const t = setTimeout(() => {
      if (inputQ !== filters.q) {
        updateFiltersAndStore({ q: inputQ });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [inputQ]);

  // Initial load
  useEffect(() => {
    api.get("/teams").then(({ data }) => setTeams(data)).catch(() => { });
  }, []);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (filters.q) params.set("q", filters.q);
    if (filters.position) params.set("position", filters.position);
    if (filters.teamId) params.set("teamId", filters.teamId);
    if (filters.foot) params.set("foot", filters.foot);
    if (filters.ageMin) params.set("ageMin", filters.ageMin);
    if (filters.ageMax) params.set("ageMax", filters.ageMax);
    if (filters.heightMin) params.set("heightMin", filters.heightMin);
    if (filters.heightMax) params.set("heightMax", filters.heightMax);
    if (filters.minRating) params.set("minRating", filters.minRating);
    if (filters.marketValueMax) params.set("valueMax", filters.marketValueMax);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);

    try {
      const { data } = await api.get(`/players?${params}`);
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, pageSize, _hasHydrated]);

  useEffect(() => { 
    if (_hasHydrated) fetchPlayers(); 
  }, [fetchPlayers, _hasHydrated]);

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "sortBy") return false;
    if (key === "minRating" && val === "6.0") return false;
    return val !== "" && val !== undefined;
  }).length;
  const totalItems = 55; // Placeholder for total count
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-8 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight leading-none">Explorar Jugadores</h1>
          <p className="text-secondary mt-3 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full  animate-pulse" />
            Mostrando talentos activos • Apertura 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden mr-3">
            <Button isIconOnly onClick={() => setView("grid")} className={`min-w-10 w-10 h-10 rounded-lg transition-all ${view === "grid" ? "bg-white/10 text-primary shadow-sm" : "bg-transparent text-muted hover:text-secondary"}`}>
              <LayoutGrid size={18} />
            </Button>
            <Button isIconOnly onClick={() => setView("table")} className={`min-w-10 w-10 h-10 rounded-lg transition-all ${view === "table" ? "bg-white/10 text-primary shadow-sm" : "bg-transparent text-muted hover:text-secondary"}`}>
              <List size={18} />
            </Button>
          </div>

          {activeFilterCount > 0 && (
            <Button
              isIconOnly
              onClick={() => {
                const resetState = {
                  q: "", position: "", teamId: "", foot: "",
                  ageMin: "", ageMax: "", heightMin: "", heightMax: "",
                  minRating: "6.0", marketValueMax: "", sortBy: "rating_desc"
                };
                updateFiltersAndStore(resetState);
                setInputQ("");
              }}
              className="h-10 w-10 min-w-10 md:h-12 md:w-12 md:min-w-12 rounded-xl bg-[#e05a5a]/10 text-[#e05a5a] border border-[#e05a5a]/25 hover:bg-[#e05a5a]/20 transition-all shadow-[0_0_15px_rgba(224,90,90,0.1)]"
              aria-label="Limpiar filtros"
            >
              <X size={18} strokeWidth={2.5} />
            </Button>
          )}

          <AppButton
            onClick={() => setFilterPanelOpen(true)}
            variant={activeFilterCount > 0 ? "primary" : "secondary"}
            className="h-10 md:h-12 px-4 md:px-6 gap-2 md:gap-3"
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-lg bg-mainBg text-green text-xs font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </AppButton>
        </div>
      </div>

      {/* ── Search & Quick Bar ── */}
      <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-sm">
        <div className="w-full max-w-[320px]">
          <Input
            value={inputQ}
            onChange={(e) => { setInputQ(e.target.value); setPage(1); }}
            placeholder="Buscar por jugador..."
            startContent={<Search size={16} className="text-muted flex-shrink-0" />}
            endContent={
              inputQ && (
                <button onClick={() => { setInputQ(""); setPage(1); }}>
                  <X size={15} className="text-secondary transition-colors" />
                </button>
              )
            }
            variant="flat"
            classNames={{
              inputWrapper: " h-12 bg-card border border-white/10 rounded-xl group-data-[focus=true]:border-green/40 group-data-[focus=true]:shadow-[0_0_20px_rgba(0,224,148,0.1)]",
              input: "text-base text-primary placeholder:text-secondary"
            }}
          />
        </div>

        {/* Quick Position Multi-Select */}
        <div className="w-full max-w-[280px] hidden sm:block">
          <Select
            selectionMode="multiple"
            items={POSITIONS_LIST}
            placeholder="Filtrar posiciones"
            selectedKeys={filters.position ? new Set(filters.position.split(",")) : new Set()}
            onSelectionChange={(keys: any) => {
              const arr = Array.from(keys).join(",");
              updateFiltersAndStore({ position: arr });
            }}
            classNames={{
              trigger: `${sharedSelectClasses.trigger} h-12`,
              value: sharedSelectClasses.value,
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
        <div className="w-full max-w-[200px] hidden lg:block ml-auto">
          <Select
            labelPlacement="outside"
            placeholder="Ordenar por"
            selectedKeys={[filters.sortBy]}
            onChange={(e) => {
              if (e.target.value) {
                updateFiltersAndStore({ sortBy: e.target.value });
              }
            }}
            classNames={{
              trigger: `${sharedSelectClasses.trigger} h-12`,
              value: sharedSelectClasses.value,
              popoverContent: sharedSelectClasses.popoverContent,
            }}
            aria-label="Ordenar por"
          >
            <SelectItem key="rating_desc" textValue="Rating (Mayor)" classNames={sharedSelectItemClasses}>Rating (Mayor)</SelectItem>
            <SelectItem key="value_desc" textValue="Valor (Mayor)" classNames={sharedSelectItemClasses}>Valor (Mayor)</SelectItem>
            <SelectItem key="value_asc" textValue="Valor (Menor)" classNames={sharedSelectItemClasses}>Valor (Menor)</SelectItem>
            <SelectItem key="age_asc" textValue="Edad (Menor)" classNames={sharedSelectItemClasses}>Edad (Menor)</SelectItem>
            <SelectItem key="age_desc" textValue="Edad (Mayor)" classNames={sharedSelectItemClasses}>Edad (Mayor)</SelectItem>
          </Select>
        </div>
      </div>

      {/* ── Active Filters Chips ── */}
      {_hasHydrated && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-[-8px]">
          <span className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mr-2">Filtros activos:</span>
          
          {filters.position && filters.position.split(",").map(pos => (
            <div key={pos} className="flex items-center gap-1.5 bg-[#34d35a]/10 border border-[#34d35a]/20 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black text-green uppercase">{pos}</span>
              <button onClick={() => {
                const arr = filters.position.split(",").filter(p => p !== pos);
                updateFiltersAndStore({ position: arr.join(",") });
              }} className="text-green/60 hover:text-green"><X size={10} strokeWidth={3} /></button>
            </div>
          ))}

          {filters.teamId && filters.teamId.split(",").map(tid => {
            const teamName = teams.find(t => t.id.toString() === tid)?.name || "Club";
            return (
              <div key={tid} className="flex items-center gap-1.5 bg-[#34d35a]/10 border border-[#34d35a]/20 px-2 py-1 rounded-lg">
                <span className="text-[10px] font-black text-green uppercase">{teamName}</span>
                <button onClick={() => {
                  const arr = filters.teamId.split(",").filter(p => p !== tid);
                  updateFiltersAndStore({ teamId: arr.join(",") });
                }} className="text-green/60 hover:text-green"><X size={10} strokeWidth={3} /></button>
              </div>
            );
          })}

          {filters.foot && filters.foot.split(",").map(f => (
            <div key={f} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black text-blue-400 uppercase">Pie: {f === "Both" ? "Ambi" : f === "Left" ? "Zurdo" : "Diestro"}</span>
              <button onClick={() => {
                const arr = filters.foot.split(",").filter(p => p !== f);
                updateFiltersAndStore({ foot: arr.join(",") });
              }} className="text-blue-400/60 hover:text-blue-400"><X size={10} strokeWidth={3} /></button>
            </div>
          ))}

          {(filters.ageMin || filters.ageMax) && (
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black text-purple-400 uppercase">Edad: {filters.ageMin || "0"}-{filters.ageMax || "50"}</span>
              <button onClick={() => updateFiltersAndStore({ ageMin: "", ageMax: "" })} className="text-purple-400/60 hover:text-purple-400"><X size={10} strokeWidth={3} /></button>
            </div>
          )}

          {filters.marketValueMax && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black text-orange-400 uppercase">Máx: {filters.marketValueMax}M€</span>
              <button onClick={() => updateFiltersAndStore({ marketValueMax: "" })} className="text-orange-400/60 hover:text-orange-400"><X size={10} strokeWidth={3} /></button>
            </div>
          )}

          <button 
            onClick={() => {
              const resetState = {
                q: "", position: "", teamId: "", foot: "",
                ageMin: "", ageMax: "", heightMin: "", heightMax: "",
                minRating: "6.0", marketValueMax: "", sortBy: "rating_desc"
              };
              updateFiltersAndStore(resetState);
              setInputQ("");
            }}
            className="text-[10px] font-black text-danger uppercase tracking-[0.1em] hover:underline ml-2"
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base text-muted font-black uppercase tracking-widest">Mostrar:</span>
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
            <span className="text-base text-muted font-bold tracking-tight">
              {Math.min(page * pageSize, totalItems)} de {totalItems}
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
        setFilters={(n: any) => updateFiltersAndStore(n)}
        onReset={() => {
          const resetState = {
            q: "", position: "", teamId: "", foot: "",
            ageMin: "", ageMax: "", heightMin: "", heightMax: "",
            minRating: "6.0", marketValueMax: "", sortBy: "rating_desc"
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
