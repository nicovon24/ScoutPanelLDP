"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import PlayerCard from "@/components/player/PlayerCard";

interface Player {
  id: number; name: string; position: string;
  nationality?: string; dateOfBirth?: string;
  photoUrl?: string; marketValueM?: string;
  team?: { name: string; logoUrl?: string };
  stats?: { sofascoreRating?: string; goals?: number; assists?: number; matchesPlayed?: number }[];
}
interface Team { id: number; name: string; }

const POSITIONS = [
  { val: "",    label: "Todos",  group: "all" },
  { val: "GK",  label: "GK",    group: "gk" },
  { val: "CB",  label: "CB",    group: "def" },
  { val: "LB",  label: "LB",    group: "def" },
  { val: "RB",  label: "RB",    group: "def" },
  { val: "CDM", label: "CDM",   group: "mid" },
  { val: "CM",  label: "CM",    group: "mid" },
  { val: "CAM", label: "CAM",   group: "mid" },
  { val: "LW",  label: "LW",    group: "att" },
  { val: "RW",  label: "RW",    group: "att" },
  { val: "SS",  label: "SS",    group: "att" },
  { val: "CF",  label: "CF",    group: "att" },
];

const POS_GROUP_LABEL: Record<string, string> = {
  gk: "Portero", def: "Defensa", mid: "Mediocampo", att: "Ataque"
};

const SORT_OPTIONS = [
  { val: "rating_desc",  label: "⭐ Mejor rating" },
  { val: "rating_asc",   label: "Rating (menor)" },
  { val: "name_asc",     label: "A → Z" },
  { val: "name_desc",    label: "Z → A" },
  { val: "age_asc",      label: "Más jóvenes" },
  { val: "age_desc",     label: "Más experimentados" },
  { val: "value_desc",   label: "💰 Mayor valor" },
  { val: "value_asc",    label: "Menor valor" },
  { val: "goals_desc",   label: "⚽ Más goles" },
  { val: "assists_desc", label: "🎯 Más asistencias" },
];

const LIMIT = 16;

function PlayersContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [players,     setPlayers]     = useState<Player[]>([]);
  const [teams,       setTeams]       = useState<Team[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [q,           setQ]       = useState(searchParams.get("q") ?? "");
  const [position,    setPos]     = useState(searchParams.get("position") ?? "");
  const [teamId,      setTeamId]  = useState(searchParams.get("teamId") ?? "");
  const [foot,        setFoot]    = useState("");
  const [ageMin,      setAgeMin]  = useState("");
  const [ageMax,      setAgeMax]  = useState("");
  const [valueMin,    setValMin]  = useState("");
  const [valueMax,    setValMax]  = useState("");
  const [sortBy,      setSort]    = useState("rating_desc");

  // Input debounce for search
  const [inputQ, setInputQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setQ(inputQ), 350);
    return () => clearTimeout(t);
  }, [inputQ]);

  // Load teams for filter
  useEffect(() => {
    api.get("/teams").then(({ data }) => setTeams(data)).catch(() => {});
  }, []);

  const fetchPlayers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: String(LIMIT), sortBy,
    });
    if (q)        params.set("q",           q);
    if (position) params.set("position",    position);
    if (teamId)   params.set("teamId",      teamId);
    if (foot)     params.set("foot",        foot);
    if (ageMin)   params.set("ageMin",      ageMin);
    if (ageMax)   params.set("ageMax",      ageMax);
    if (valueMin) params.set("valueMin",    valueMin);
    if (valueMax) params.set("valueMax",    valueMax);

    api.get(`/players?${params}`)
      .then(({ data }) => setPlayers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, q, position, teamId, foot, ageMin, ageMax, valueMin, valueMax, sortBy]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const resetFilters = () => {
    setQ(""); setInputQ(""); setPos(""); setTeamId(""); setFoot("");
    setAgeMin(""); setAgeMax(""); setValMin(""); setValMax("");
    setSort("rating_desc"); setPage(1);
  };

  const activeFilterCount = [q, position, teamId, foot, ageMin, ageMax, valueMin, valueMax]
    .filter(Boolean).length;

  const posGroups = ["gk", "def", "mid", "att"];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-black text-primary">Jugadores</h1>
          <p className="text-[12px] text-muted mt-0.5">
            Liga Profesional Argentina · {players.length} resultado{players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select value={sortBy} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="select-field text-[12px] h-9 pr-8">
              {SORT_OPTIONS.map((o) => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          </div>
          {/* Filter toggle */}
          <button onClick={() => setShowFilters((v) => !v)}
                  className={`btn text-[12px] h-9 gap-1.5 ${showFilters || activeFilterCount > 0 ? "btn-primary" : "btn-ghost"}`}>
            <SlidersHorizontal size={13} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-base text-green text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters}
                    className="btn btn-ghost text-[12px] h-9 text-muted hover:text-danger gap-1">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg
                      px-3.5 py-2.5 focus-within:border-green/60 transition-colors">
        <Search size={14} className="text-muted flex-shrink-0" />
        <input
          value={inputQ}
          onChange={(e) => { setInputQ(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre..."
          className="flex-1 bg-transparent text-[13px] text-primary placeholder:text-muted outline-none"
        />
        {inputQ && <button onClick={() => { setInputQ(""); setQ(""); setPage(1); }}><X size={13} className="text-muted hover:text-secondary" /></button>}
      </div>

      {/* ── Position pills ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* All */}
          <button onClick={() => { setPos(""); setPage(1); }}
                  className={`badge cursor-pointer text-[11px] py-1 transition-all
                              ${position === "" ? "badge-green" : "badge-muted hover:border-border-h"}`}>
            Todos
          </button>
          {/* Groups */}
          {posGroups.map((group) => {
            const groupPositions = POSITIONS.filter((p) => p.group === group);
            const groupActive = groupPositions.some((p) => p.val === position);
            return (
              <div key={group} className="flex items-center gap-1">
                <span className="text-[10px] text-muted font-medium">{POS_GROUP_LABEL[group]}:</span>
                {groupPositions.map((p) => (
                  <button key={p.val} onClick={() => { setPos(p.val); setPage(1); }}
                          className={`badge cursor-pointer text-[11px] py-1 transition-all
                                      ${position === p.val
                                        ? p.group === "att" ? "pos-attack" : p.group === "mid" ? "pos-mid" : p.group === "def" ? "pos-def" : "pos-gk"
                                        : "badge-muted hover:border-border-h"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="card animate-fade-in">
          <p className="section-title mb-4">Filtros avanzados</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Club */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Club</label>
              <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setPage(1); }}
                      className="select-field text-[12px] w-full">
                <option value="">Todos los clubes</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Pie hábil */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Pie hábil</label>
              <select value={foot} onChange={(e) => { setFoot(e.target.value); setPage(1); }}
                      className="select-field text-[12px] w-full">
                <option value="">Cualquiera</option>
                <option value="Right">Derecho</option>
                <option value="Left">Zurdo</option>
                <option value="Both">Ambidiestro</option>
              </select>
            </div>

            {/* Edad min */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Edad mín.</label>
              <input type="number" min={15} max={45} value={ageMin}
                     onChange={(e) => { setAgeMin(e.target.value); setPage(1); }}
                     placeholder="ej. 18"
                     className="field text-[12px]" />
            </div>

            {/* Edad max */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Edad máx.</label>
              <input type="number" min={15} max={45} value={ageMax}
                     onChange={(e) => { setAgeMax(e.target.value); setPage(1); }}
                     placeholder="ej. 23"
                     className="field text-[12px]" />
            </div>

            {/* Valor min */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Valor mín. (M€)</label>
              <input type="number" min={0} value={valueMin}
                     onChange={(e) => { setValMin(e.target.value); setPage(1); }}
                     placeholder="ej. 5"
                     className="field text-[12px]" />
            </div>

            {/* Valor max */}
            <div>
              <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Valor máx. (M€)</label>
              <input type="number" min={0} value={valueMax}
                     onChange={(e) => { setValMax(e.target.value); setPage(1); }}
                     placeholder="ej. 15"
                     className="field text-[12px]" />
            </div>
          </div>

          {/* Scout presets */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold mb-2">Búsquedas rápidas 🎯</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Sub-23 prometedores", action: () => { setAgeMax("23"); setSort("rating_desc"); } },
                { label: "Goleadores",           action: () => { setPos("CF"); setSort("goals_desc"); } },
                { label: "Zurdos",                action: () => { setFoot("Left"); } },
                { label: "Defensores jóvenes",   action: () => { setPos("CB"); setAgeMax("25"); setSort("rating_desc"); } },
                { label: "Alto valor",            action: () => { setValMin("10"); setSort("value_desc"); } },
              ].map((preset) => (
                <button key={preset.label}
                        onClick={() => { preset.action(); setShowFilters(false); setPage(1); }}
                        className="btn btn-ghost text-[11px] h-7 px-2.5">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-green" />
        </div>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-[14px] text-secondary">Sin resultados</p>
          <p className="text-[12px] text-muted">Probá con otros filtros</p>
          <button onClick={resetFilters} className="btn btn-ghost text-[12px] mt-2">
            <X size={12} /> Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page === 1} onClick={() => setPage((v) => v - 1)}
                  className="btn btn-ghost px-3 h-9 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] text-secondary font-medium px-2">Página {page}</span>
          <button disabled={players.length < LIMIT} onClick={() => setPage((v) => v + 1)}
                  className="btn btn-ghost px-3 h-9 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-green" /></div>}>
      <PlayersContent />
    </Suspense>
  );
}
