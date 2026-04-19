"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, X, Search } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import type { SearchHit } from "@/types";

interface Props {
  onSelect: (p: SearchHit) => void;
  excludeIds?: number[];
}

export default function PlayerSearch({ onSelect, excludeIds = [] }: Props) {
  const [q, setQ]           = useState("");
  const [results, setRes]   = useState<SearchHit[]>([]);
  const [loading, setLoad]  = useState(false);
  const [open, setOpen]     = useState(false);
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const timer               = useRef<ReturnType<typeof setTimeout>>();

  const searchPlayers = useCallback(async (val: string) => {
    if (!val.trim()) return;
    setLoad(true);
    try {
      const { data } = await api.get<{ players: SearchHit[] }>(`/players/search?q=${encodeURIComponent(val)}`);
      setRes(data.players.filter(p => !excludeIds.includes(p.id)));
      setOpen(true);
    } catch { setRes([]); } finally { setLoad(false); }
  }, [excludeIds]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (q.length >= 2) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => searchPlayers(q), 280);
    } else {
      setRes([]);
      if (q.length === 0) setOpen(false);
    }
    return () => clearTimeout(timer.current);
  }, [q, searchPlayers]);

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-[9px]">
        {loading
          ? <Loader2 size={13} className="animate-spin text-muted" />
          : <Search size={13} className="text-muted" />}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Buscar jugador…"
          className="flex-1 bg-transparent text-[12px] font-bold text-primary placeholder:text-muted outline-none"
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }}>
            <X size={12} className="text-muted" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-surface-2 border border-border rounded-[10px] shadow-xl z-50 max-h-[280px] overflow-y-auto w-[260px]">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQ(""); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-border hover:bg-white/[0.04] transition-colors text-left last:border-0"
            >
              <div className="w-7 h-7 rounded-full bg-input flex items-center justify-center text-[10px] font-black text-secondary shrink-0 overflow-hidden">
                {p.photoUrl
                  ? <Image src={p.photoUrl} alt={p.name} width={28} height={28} className="object-cover" unoptimized />
                  : p.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold text-primary truncate">{p.name}</p>
                <p className="text-[10px] text-muted truncate">{p.position} · {p.nationality}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
