"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Star, X, LayoutGrid, User, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";
import { Select, SelectItem, Input } from "@nextui-org/react";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";
import { useScoutStore } from "@/store/useScoutStore";
import FlagImg from "@/components/ui/FlagImg";

interface SearchResult {
  players: { id: number; name: string; position: string; photoUrl?: string; nationality?: string }[];
  teams: { id: number; name: string; country: string; logoUrl?: string }[];
}

function posClass(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  if (p === "GK") return "pos-gk";
  return "badge-muted";
}

const TYPE_PILLS: { key: "all" | "players" | "clubs"; icon: typeof LayoutGrid; label: string }[] = [
  { key: "all",     icon: LayoutGrid, label: "Todo" },
  { key: "players", icon: User,       label: "Jugadores" },
  { key: "clubs",   icon: Building2,  label: "Clubes" },
];

interface Props {
  fullWidth?: boolean;
  /** Modo compacto para sidebar: selector como píldoras, input full width */
  compact?: boolean;
}

export default function SearchBar({ fullWidth = false, compact = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsLoadedRef = useRef(false);

  const { favorites, searchType: type, setSearchType: setType } = useScoutStore();

  // ── Fetch suggestions once (lazy, on first focus) ───────────────────────────
  const loadSuggestions = useCallback(async () => {
    if (suggestionsLoadedRef.current) return;
    suggestionsLoadedRef.current = true;
    try {
      const [playersRes, teamsRes] = await Promise.all([
        api.get<SearchResult>("/players/search?q="),
        api.get<{ id: number; name: string; country: string; logoUrl?: string }[]>("/teams"),
      ]);
      const favIds = new Set(favorites.map((f) => f.id));
      const favPlayers = favorites.map((f) => ({
        id: f.id, name: f.name, position: f.position,
        photoUrl: f.photoUrl, nationality: f.nationality,
      }));
      const restPlayers = playersRes.data.players
        .filter((p) => !favIds.has(p.id))
        .slice(0, 20 - favPlayers.length);
      const teams = [...teamsRes.data]
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .slice(0, 20);
      setSuggestions({ players: [...favPlayers, ...restPlayers], teams });
    } catch { /* ignore */ }
  }, [favorites]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get<SearchResult>(`/players/search?q=${encodeURIComponent(q)}`);
        setResults(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 280);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  const isSuggesting = query.length < 2;
  const active: SearchResult | null = isSuggesting ? suggestions : results;
  const showPlayers = (type === "all" || type === "players") && (active?.players.length ?? 0) > 0;
  const showTeams   = (type === "all" || type === "clubs")   && (active?.teams.length   ?? 0) > 0;
  const hasContent  = showPlayers || showTeams;

  const handleFocus = () => { loadSuggestions(); setOpen(true); };

  const placeholder = type === "players" ? "Buscar jugador..."
    : type === "clubs" ? "Buscar club..."
    : "Buscar jugador o club...";

  return (
    <div ref={wrapperRef} className={`relative w-full ${fullWidth ? "" : "max-w-xl"}`}>

      {/* ── COMPACT mode: pills arriba + input full width ─────────────────────── */}
      {compact ? (
        <div className="space-y-2">
          {/* Type pills */}
          <div className="flex gap-1.5">
            {TYPE_PILLS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`flex items-center justify-center gap-1.5 flex-1 h-8 rounded-lg text-[11px] font-black
                            transition-all border
                            ${type === key
                              ? "bg-green/15 border-green/30 text-green shadow-[0_0_8px_rgba(0,224,148,0.12)]"
                              : "bg-white/[0.03] border-white/[0.06] text-muted hover:text-secondary hover:bg-white/[0.05]"}`}
              >
                <Icon size={12} className="flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-card border border-white/[0.06] rounded-xl px-3 h-10
                          focus-within:border-green/40 focus-within:shadow-[0_0_16px_rgba(0,224,148,0.08)]
                          transition-all">
            {loading
              ? <div className="w-3.5 h-3.5 border-2 border-green/30 border-t-green rounded-full animate-spin flex-shrink-0" />
              : <Search size={14} className="text-muted flex-shrink-0" />}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none min-w-0"
            />
            {query && (
              <button onClick={() => { setQuery(""); setOpen(true); }} className="flex-shrink-0">
                <X size={13} className="text-muted hover:text-secondary transition-colors" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── NORMAL mode: select lateral + input ─────────────────────────────── */
        <div className="flex items-center bg-card border border-white/[0.05] rounded-xl
                        transition-all duration-200 focus-within:border-green/40
                        focus-within:shadow-[0_0_20px_rgba(0,224,148,0.1)] overflow-hidden">
          {/* Type Selector */}
          <div className="w-[200px] border-r border-white/[0.05] bg-white/[0.02] flex items-center">
            <Select
              selectedKeys={[type]}
              onChange={(e) => { if (e.target.value) setType(e.target.value as "all" | "players" | "clubs"); }}
              size="sm"
              classNames={{
                trigger: "bg-transparent hover:bg-transparent data-[hover=true]:bg-transparent shadow-none px-3 h-12 min-h-12 border-none rounded-none w-full",
                value: "text-[11px] font-black uppercase tracking-widest text-[#7aab82] group-data-[hover=true]:text-primary leading-none",
                popoverContent: sharedSelectClasses.popoverContent,
                innerWrapper: "gap-1",
                selectorIcon: "text-muted"
              }}
              aria-label="Filtro"
            >
              <SelectItem key="all" value="all" classNames={sharedSelectItemClasses}>Todo</SelectItem>
              <SelectItem key="players" value="players" classNames={sharedSelectItemClasses}>Jugadores</SelectItem>
              <SelectItem key="clubs" value="clubs" classNames={sharedSelectItemClasses}>Clubes</SelectItem>
            </Select>
          </div>

          {/* Input */}
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder={placeholder}
              startContent={
                loading
                  ? <div className="w-4 h-4 border-2 border-green/30 border-t-green rounded-full animate-spin flex-shrink-0" />
                  : <Search size={16} className="text-muted flex-shrink-0" />
              }
              endContent={
                query && (
                  <button onClick={() => { setQuery(""); setOpen(true); }}>
                    <X size={15} className="text-muted hover:text-secondary transition-colors" />
                  </button>
                )
              }
              variant="flat"
              classNames={{
                base: "h-12",
                mainWrapper: "h-full",
                inputWrapper: "h-full bg-transparent border-none shadow-none hover:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent",
                input: "text-base text-primary placeholder:text-secondary"
              }}
            />
          </div>
        </div>
      )}

      {/* ── Dropdown (shared entre ambos modos) ────────────────────────────────── */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-white/[0.05]
                        rounded-xl shadow-2xl z-[200] overflow-hidden animate-fade-in ring-1 ring-black/50
                        max-h-[380px] overflow-y-auto">

          {!hasContent && !isSuggesting && query.length >= 2 && (
            <p className="text-center text-muted py-8 text-sm">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}

          {/* Players */}
          {showPlayers && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60
                            px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                {isSuggesting ? "Jugadores" : "Resultados · Jugadores"}
              </p>
              {active!.players
                .filter((_, i) => type === "all" ? i < 5 : true)
                .map((p, idx) => {
                  const isFav = favorites.some((f) => f.id === p.id);
                  return (
                    <button key={p.id} onClick={() => go(`/players/${p.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5
                                 hover:bg-white/[0.03] transition-colors text-left group">
                      <div className="relative w-9 h-9 rounded-full bg-input border border-white/[0.05]
                                      flex items-center justify-center flex-shrink-0 overflow-hidden
                                      group-hover:border-green/30 transition-colors">
                        {p.photoUrl
                          ? <Image src={p.photoUrl} alt={p.name} width={36} height={36}
                              className="object-cover w-full h-full" unoptimized />
                          : <span className="text-xs font-bold text-muted">{p.name[0]}</span>}
                        {isFav && idx < favorites.length && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold
                                           flex items-center justify-center shadow">
                            <Star size={6} className="text-mainBg fill-mainBg" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate group-hover:text-green transition-colors">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.nationality && <FlagImg nationality={p.nationality} size={10} />}
                          <span className="text-xs text-muted">{p.nationality}</span>
                        </div>
                      </div>
                      <span className={`badge text-2xs ${posClass(p.position)}`}>{p.position}</span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Teams */}
          {showTeams && (
            <div className={(type === "all" && showPlayers) ? "border-t border-white/[0.05]" : ""}>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60
                            px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                {isSuggesting ? "Clubes" : "Resultados · Clubes"}
              </p>
              {active!.teams
                .filter((_, i) => type === "all" ? i < 5 : true)
                .map((t) => (
                  <button key={t.id} onClick={() => go(`/clubs/${t.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5
                               hover:bg-white/[0.03] transition-colors text-left group">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 bg-input border border-white/[0.05]
                                    flex items-center justify-center overflow-hidden
                                    group-hover:border-green/30 transition-colors">
                      {t.logoUrl
                        ? <Image src={t.logoUrl} alt={t.name} width={28} height={28} unoptimized />
                        : <span className="text-xs text-muted">{t.name[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary truncate group-hover:text-green transition-colors">
                        {t.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <FlagImg nationality={t.country} size={10} />
                        <span className="text-xs text-muted">{t.country}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
