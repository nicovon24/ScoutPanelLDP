"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";

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

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "players" | "clubs">("all");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get<SearchResult>(`/players/search?q=${encodeURIComponent(q)}`);
        setResults(data);
        setOpen(true);
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

  const hasResults = results && (
    (type === "all" || type === "players") && results.players.length > 0 ||
    (type === "all" || type === "clubs") && results.teams.length > 0
  );

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Input Group */}
      <div className="flex items-center bg-card border border-white/[0.05] rounded-xl
                      transition-all duration-200 focus-within:border-green/40 focus-within:shadow-[0_0_20px_rgba(0,224,148,0.1)] overflow-hidden">

        {/* Type Selector */}
        <div className="relative border-r border-white/[0.05] bg-white/[0.02]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="appearance-none bg-transparent text-[11px] font-black uppercase tracking-widest text-secondary px-4 pr-8 h-12 outline-none cursor-pointer hover:text-primary transition-colors focus:bg-transparent"
          >
            <option value="all" className="bg-card text-primary font-bold">Todo</option>
            <option value="players" className="bg-card text-primary font-bold">Jugadores</option>
            <option value="clubs" className="bg-card text-primary font-bold">Clubes</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 flex-1 px-4 py-3">
          {loading
            ? <div className="w-4 h-4 border-2 border-green/30 border-t-green rounded-full animate-spin flex-shrink-0" />
            : <Search size={16} className="text-muted flex-shrink-0" />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results && setOpen(true)}
            placeholder={type === "players" ? "Buscar jugador..." : type === "clubs" ? "Buscar club..." : "Buscar jugador o club..."}
            className="flex-1 bg-transparent text-[14px] text-primary placeholder:text-secondary outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setOpen(false); }}>
              <X size={15} className="text-muted hover:text-secondary transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-white/[0.05]
                        rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in ring-1 ring-black/50">
          {!hasResults ? (
            <p className="text-center text-muted py-8 text-[13px]">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {(type === "all" || type === "players") && results!.players.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted/60
                                px-5 py-3 border-b border-white/[0.03] bg-white/[0.01]">
                    Resultados de Jugadores
                  </p>
                  {results!.players.map((p) => (
                    <button key={p.id} onClick={() => go(`/players/${p.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-3.5
                                       hover:bg-white/[0.03] transition-colors text-left group">
                      <div className="w-10 h-10 rounded-full bg-input border border-white/[0.05]
                                      flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-green/30 transition-colors">
                        {p.photoUrl
                          ? <Image src={p.photoUrl} alt={p.name} width={40} height={40}
                            className="object-cover w-full h-full" unoptimized />
                          : <span className="text-sm font-bold text-muted">{p.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-primary truncate group-hover:text-green transition-colors">{p.name}</p>
                        <p className="text-[12px] text-muted">{p.nationality}</p>
                      </div>
                      <span className={`badge text-[10px] ${posClass(p.position)}`}>{p.position}</span>
                    </button>
                  ))}
                </div>
              )}

              {(type === "all" || type === "clubs") && results!.teams.length > 0 && (
                <div className={(type === "all" && results!.players.length > 0) ? "border-t border-white/[0.05]" : ""}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted/60
                                px-5 py-3 border-b border-white/[0.03] bg-white/[0.01]">
                    Resultados de Clubes
                  </p>
                  {results!.teams.map((t) => (
                    <button key={t.id} onClick={() => go(`/players?teamId=${t.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-3.5
                                       hover:bg-white/[0.03] transition-colors text-left group">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-input border border-white/[0.05]
                                      flex items-center justify-center overflow-hidden group-hover:border-green/30 transition-colors">
                        {t.logoUrl
                          ? <Image src={t.logoUrl} alt={t.name} width={30} height={30} unoptimized />
                          : <span className="text-sm text-muted">{t.name[0]}</span>}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-primary group-hover:text-green transition-colors">{t.name}</p>
                        <p className="text-[12px] text-muted">{t.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
