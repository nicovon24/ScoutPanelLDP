"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, X, Search, User } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import type { SearchHit } from "@/types";

interface Props {
  onSelect: (p: SearchHit) => void;
  excludeIds?: number[];
}

export default function PlayerSearch({ onSelect, excludeIds = [] }: Props) {
  const [q, setQ]                   = useState("");
  const [results, setRes]           = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [loading, setLoad]          = useState(false);
  const [open, setOpen]             = useState(false);
  const wrapperRef                  = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const timer                       = useRef<ReturnType<typeof setTimeout>>();
  const suggestionsLoaded           = useRef(false);

  // Load initial suggestions on mount (top 20 players alphabetically)
  useEffect(() => {
    if (suggestionsLoaded.current) return;
    api.get<{ players: SearchHit[] }>("/players/search?q=&limit=20")
      .then(({ data }) => {
        suggestionsLoaded.current = true;
        setSuggestions(data.players ?? []);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const searchPlayers = useCallback(async (val: string) => {
    setLoad(true);
    try {
      const { data } = await api.get<{ players: SearchHit[] }>(
        `/players/search?q=${encodeURIComponent(val)}&limit=15`
      );
      setRes(data.players ?? []);
      setOpen(true);
    } catch {
      setRes([]);
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.length >= 2) {
      timer.current = setTimeout(() => searchPlayers(q), 280);
    } else {
      setRes([]);
    }
    return () => clearTimeout(timer.current);
  }, [q, searchPlayers]);

  const handleFocus = () => {
    setOpen(true);
  };

  const handleSelect = (p: SearchHit) => {
    onSelect(p);
    setQ("");
    setRes([]);
    setOpen(false);
  };

  // Which list to show: search results when typing, suggestions when empty
  const displayed = (q.length >= 2 ? results : suggestions)
    .filter(p => !excludeIds.includes(p.id));

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      {/* Input */}
      <div
        className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2xs
                   focus-within:border-green/40 focus-within:shadow-[0_0_14px_rgba(0,224,148,0.08)] transition-all"
      >
        {loading
          ? <Loader2 size={13} className="animate-spin text-muted flex-shrink-0" />
          : <Search size={13} className="text-muted flex-shrink-0" />}
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={handleFocus}
          placeholder="Buscar jugador…"
          className="flex-1 bg-transparent text-[12px] font-bold text-primary placeholder:text-muted outline-none min-w-0"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setRes([]); inputRef.current?.focus(); }}
            className="flex-shrink-0"
          >
            <X size={12} className="text-muted hover:text-secondary transition-colors" />
          </button>
        )}
      </div>

      {/* Dropdown — inline (no portal), z-index alto para salir por encima del overflow */}
      {open && displayed.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1
                     bg-[#141414] border border-white/[0.08] rounded-2xs shadow-2xl
                     max-h-[260px] overflow-y-auto ring-1 ring-black/60"
          style={{ zIndex: 9999 }}
        >
          {q.length < 2 && (
            <div className="px-3 pt-2.5 pb-1">
              <span className="text-2xs font-black uppercase tracking-[0.16em] text-muted/60">
                Sugeridos
              </span>
            </div>
          )}
          {displayed.map(p => (
            <button
              key={p.id}
              onMouseDown={e => e.preventDefault()}  /* evita blur del input */
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.05]
                         hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left last:border-0"
            >
              <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center
                              text-2xs font-black text-secondary shrink-0 overflow-hidden">
                {p.photoUrl
                  ? <Image src={p.photoUrl} alt={p.name} width={28} height={28} className="object-cover" unoptimized />
                  : <User size={13} className="text-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold text-primary truncate">{p.name}</p>
                <p className="text-2xs text-muted truncate">{p.position} · {p.nationality}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
