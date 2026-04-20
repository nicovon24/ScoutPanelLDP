"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Search } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import type { SearchHit } from "@/types";

interface Props {
  onSelect: (p: SearchHit) => void;
  excludeIds?: number[];
}

interface DropdownPos { top: number; left: number; width: number }

export default function PlayerSearch({ onSelect, excludeIds = [] }: Props) {
  const [q, setQ]           = useState("");
  const [results, setRes]   = useState<SearchHit[]>([]);
  const [loading, setLoad]  = useState(false);
  const [open, setOpen]     = useState(false);
  const [pos, setPos]       = useState<DropdownPos | null>(null);
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const timer               = useRef<ReturnType<typeof setTimeout>>();

  const updatePos = useCallback(() => {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  }, []);

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
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [updatePos]);

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

  const handleFocus = () => {
    updatePos();
    if (results.length > 0) setOpen(true);
  };

  const dropdown = open && results.length > 0 && pos ? createPortal(
    <div
      className="bg-[#141414] border border-white/[0.08] rounded-[10px] shadow-2xl
                 max-h-[280px] overflow-y-auto ring-1 ring-black/60"
      style={{
        position: "fixed",
        top: pos.top - window.scrollY,
        left: pos.left,
        width: Math.max(pos.width, 220),
        zIndex: 9999,
      }}
    >
      {results.map(p => (
        <button
          key={p.id}
          onClick={() => { onSelect(p); setQ(""); setOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.05]
                     hover:bg-white/[0.05] transition-colors text-left last:border-0"
        >
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center
                          text-[10px] font-black text-secondary shrink-0 overflow-hidden">
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
    </div>,
    document.body
  ) : null;

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-[9px]
                      focus-within:border-green/40 focus-within:shadow-[0_0_14px_rgba(0,224,148,0.08)] transition-all">
        {loading
          ? <Loader2 size={13} className="animate-spin text-muted flex-shrink-0" />
          : <Search size={13} className="text-muted flex-shrink-0" />}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={handleFocus}
          placeholder="Buscar jugador…"
          className="flex-1 bg-transparent text-[12px] font-bold text-primary placeholder:text-muted outline-none min-w-0"
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} className="flex-shrink-0">
            <X size={12} className="text-muted hover:text-secondary transition-colors" />
          </button>
        )}
      </div>

      {dropdown}
    </div>
  );
}
