"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";

interface SearchResult {
  players: { id: number; name: string; position: string; photoUrl?: string; nationality?: string }[];
  teams:   { id: number; name: string; country: string; logoUrl?: string }[];
}

function posClass(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF","SS","LW","RW"].includes(p)) return "pos-attack";
  if (["CAM","CM","CDM"].includes(p))    return "pos-mid";
  if (["CB","LB","RB"].includes(p))      return "pos-def";
  if (p === "GK")                        return "pos-gk";
  return "badge-muted";
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const hasResults = results && (results.players.length > 0 || results.teams.length > 0);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg
                      px-3.5 py-2 transition-colors duration-150 focus-within:border-green/60">
        {loading
          ? <div className="w-3.5 h-3.5 border-2 border-green/30 border-t-green rounded-full animate-spin flex-shrink-0" />
          : <Search size={14} className="text-muted flex-shrink-0" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Buscar jugador o club..."
          className="flex-1 bg-transparent text-[13px] text-primary placeholder:text-muted outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}>
            <X size={13} className="text-muted hover:text-secondary transition-colors" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border
                        rounded-lg shadow-2xl z-[60] overflow-hidden animate-fade-in">
          {!hasResults ? (
            <p className="text-center text-muted py-5 text-[12px]">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {results!.players.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted
                                px-4 py-2 border-b border-border bg-card-2">
                    Jugadores
                  </p>
                  {results!.players.map((p) => (
                    <button key={p.id} onClick={() => go(`/players/${p.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5
                                       hover:bg-card-2 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-input border border-border
                                      flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.photoUrl
                          ? <Image src={p.photoUrl} alt={p.name} width={32} height={32}
                                   className="object-cover w-full h-full" unoptimized />
                          : <span className="text-xs font-bold text-muted">{p.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-primary truncate">{p.name}</p>
                        <p className="text-[11px] text-muted">{p.nationality}</p>
                      </div>
                      <span className={`badge text-[10px] ${posClass(p.position)}`}>{p.position}</span>
                    </button>
                  ))}
                </div>
              )}

              {results!.teams.length > 0 && (
                <div className={results!.players.length > 0 ? "border-t border-border" : ""}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted
                                px-4 py-2 border-b border-border bg-card-2">
                    Clubes
                  </p>
                  {results!.teams.map((t) => (
                    <button key={t.id} onClick={() => go(`/players?teamId=${t.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5
                                       hover:bg-card-2 transition-colors text-left">
                      <div className="w-8 h-8 rounded flex-shrink-0 bg-input border border-border
                                      flex items-center justify-center overflow-hidden">
                        {t.logoUrl
                          ? <Image src={t.logoUrl} alt={t.name} width={22} height={22} unoptimized />
                          : <span className="text-xs text-muted">{t.name[0]}</span>}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-primary">{t.name}</p>
                        <p className="text-[11px] text-muted">{t.country}</p>
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
