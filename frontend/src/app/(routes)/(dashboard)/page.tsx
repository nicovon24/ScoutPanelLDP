"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, SlidersHorizontal, LayoutGrid, List, Search, X } from "lucide-react";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";

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
          <h1 className="text-[32px] font-black text-primary tracking-tight leading-none">Explorar Jugadores</h1>
          <p className="text-secondary mt-3 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            Mostrando talentos activos • Apertura 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden mr-3">
            <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white/10 text-primary shadow-sm" : "text-muted hover:text-secondary"}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView("table")} className={`p-2 rounded-lg transition-all ${view === "table" ? "bg-white/10 text-primary shadow-sm" : "text-muted hover:text-secondary"}`}>
              <List size={18} />
            </button>
          </div>

          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`btn h-12 px-6 gap-3 rounded-xl transition-all font-bold text-[14px]
                       ${activeFilterCount > 0 ? "btn-primary" : "bg-white/[0.05] hover:bg-white/[0.08] text-primary"}`}
          >
            <SlidersHorizontal size={18} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-lg bg-base text-green text-[11px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Search & Quick Bar ── */}
      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-sm">
        <div className="flex-1 flex items-center bg-card border border-white/[0.05] rounded-xl transition-all duration-200 focus-within:border-green/40 focus-within:shadow-[0_0_20px_rgba(0,224,148,0.1)] overflow-hidden">
          <div className="flex items-center gap-3 flex-1 px-4 py-3">
            <Search size={16} className="text-muted flex-shrink-0" />
            <input
              value={inputQ}
              onChange={(e) => { setInputQ(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, apellido..."
              className="flex-1 bg-transparent text-[14px] text-primary placeholder:text-secondary outline-none"
            />
            {inputQ && (
              <button onClick={() => { setInputQ(""); setPage(1); }}>
                <X size={15} className="text-muted hover:text-secondary transition-colors" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-primary mr-2">Status:</span>
          {["Libre", "A préstamo", "Contrato"].map(s => (
            <button key={s} className="px-3 py-1 rounded-lg text-[12px] font-bold text-secondary border border-secondary hover:border-green/30 hover:text-green transition-all">
              {s}
            </button>
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
              <span className="text-[13px] text-muted font-black uppercase tracking-widest">Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-1.5 text-[13px] font-bold text-primary focus:outline-none focus:border-green/50 hover:border-white/[0.1] transition-colors"
              >
                <option value={10} className="bg-card text-primary font-bold">10</option>
                <option value={20} className="bg-card text-primary font-bold">20</option>
                <option value={30} className="bg-card text-primary font-bold">30</option>
                <option value={40} className="bg-card text-primary font-bold">40</option>
                <option value={50} className="bg-card text-primary font-bold">50</option>
              </select>
            </div>
            <span className="text-[13px] text-muted font-bold tracking-tight">
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
