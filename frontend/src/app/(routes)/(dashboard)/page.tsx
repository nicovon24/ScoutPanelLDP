"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, SlidersHorizontal, LayoutGrid, List, Search, X } from "lucide-react";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import { Select, SelectItem, Button, Input } from "@nextui-org/react";
import AppButton from "@/components/ui/AppButton";

// Components
import PlayerGrid from "@/components/home/PlayerGrid";
import PlayerTable from "@/components/home/PlayerTable";
import FilterSidebar from "@/components/home/FilterSidebar";
import Pagination from "@/components/home/Pagination";

function HomeContent() {
  const searchParams = useSearchParams();
  const { setFilterPanelOpen, pageSize, setPageSize } = useScoutStore();

  // Data State
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "table">("grid");

  // Filters state (Sync with Sidebar)
  const [filters, setFilters] = useState({
    q: searchParams.get("q") ?? "",
    position: searchParams.get("position") ?? "",
    teamId: searchParams.get("teamId") ?? "",
    foot: "",
    ageMin: "",
    ageMax: "",
    marketValueMax: "",
  });

  // Debounced search
  const [inputQ, setInputQ] = useState(filters.q);
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, q: inputQ })), 400);
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
    if (filters.marketValueMax) params.set("valueMax", filters.marketValueMax);

    try {
      const { data } = await api.get(`/players?${params}`);
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, pageSize]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== undefined).length;
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

          <AppButton
            onClick={() => setFilterPanelOpen(true)}
            variant={activeFilterCount > 0 ? "primary" : "secondary"}
            className="h-12 px-6 gap-3"
          >
            <SlidersHorizontal size={18} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-lg bg-mainBg text-green text-xs font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </AppButton>
        </div>
      </div>

      {/* ── Search & Quick Bar ── */}
      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-sm">
        <div className="flex-1">
          <Input
            value={inputQ}
            onChange={(e) => { setInputQ(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, apellido..."
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
              inputWrapper: " h-12 bg-card border border-white/[0.05] rounded-xl group-data-[focus=true]:border-green/40 group-data-[focus=true]:shadow-[0_0_20px_rgba(0,224,148,0.1)]",
              input: "text-base text-primary placeholder:text-secondary"
            }}
          />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-primary mr-2">Status:</span>
          {["Libre", "A préstamo", "Contrato"].map(s => (
            <AppButton key={s} size="sm" variant="secondary" className="h-[34px] px-3 border border-secondary text-secondary hover:border-green/30 hover:text-green">
              {s}
            </AppButton>
          ))}
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="min-h-[400px]">
        {view === "grid"
          ? <PlayerGrid players={players} loading={loading} />
          : <PlayerTable players={players} loading={loading} />
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
                  trigger: "bg-white/[0.03] border border-white/[0.05] data-[hover=true]:border-white/[0.1] data-[focus=true]:border-green/50 data-[open=true]:border-green/50 transition-colors rounded-xl shadow-none",
                  value: "text-base font-bold text-primary",
                  popoverContent: "bg-card border border-white/[0.05]"
                }}
                aria-label="Mostrar"
              >
                <SelectItem key="10" value="10">10</SelectItem>
                <SelectItem key="20" value="20">20</SelectItem>
                <SelectItem key="30" value="30">30</SelectItem>
                <SelectItem key="40" value="40">40</SelectItem>
                <SelectItem key="50" value="50">50</SelectItem>
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
        setFilters={setFilters}
        onReset={() => {
          setFilters({ q: "", position: "", teamId: "", foot: "", ageMin: "", ageMax: "", marketValueMax: "" });
          setInputQ("");
          setPage(1);
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
