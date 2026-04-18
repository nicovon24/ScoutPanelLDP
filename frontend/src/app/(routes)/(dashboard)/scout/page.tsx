"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

interface Player {
  id: number;
  name: string;
  position: string;
  age?: number;
  dateOfBirth?: string;
  photoUrl?: string;
  matchPct?: number;
  team?: { name: string; logoUrl?: string };
  contractUntil?: string;
  height?: string;
  foot?: string;
  nationality?: string;
}

export default function ScoutPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePos, setActivePos] = useState("");
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [ageMin, setAgeMin] = useState("17");
  const [ageMax, setAgeMax] = useState("23");

  useEffect(() => {
    const t = setTimeout(() => setQ(inputQ), 350);
    return () => clearTimeout(t);
  }, [inputQ]);

  const fetchPlayers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (q) params.set("q", q);
    if (activePos) params.set("position", activePos === "PORTERO" ? "GK" : activePos === "DEFENSA" ? "CB" : activePos === "MEDIOCAMPO" ? "CM" : "CF"); // Simplification for now, should map better if backend supports groups
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);

    api.get(`/players?${params}`).then(({ data }) => {
      const enhanced = data.map((p: any, i: number) => {
        return {
          ...p,
          age: p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000) : 21,
          matchPct: Math.floor(Math.random() * 20) + 75,
          contractUntil: i % 3 === 0 ? "12/27" : i % 3 === 1 ? "12/24" : "-",
          height: (1.8 + (Math.random() * 0.15)).toFixed(2) + " mts",
          foot: p.preferredFoot === "Right" ? "Der" : "Izq"
        };
      });
      // Sort by match pct just for visual effect
      enhanced.sort((a: any, b: any) => b.matchPct - a.matchPct);
      setPlayers(enhanced);
    }).finally(() => setLoading(false));
  }, [q, activePos, ageMin, ageMax]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const clearFilters = () => {
    setActivePos("");
    setAgeMin("15");
    setAgeMax("40");
    setQ("");
    setInputQ("");
  };

  const hasFilters = activePos || ageMin !== "15" || ageMax !== "40" || q !== "";

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-mainBg -m-6 rounded-none text-primary font-sans antialiased">

      {/* ── Sidebar Filters ── */}
      <aside className="w-[360px] border-r border-white-[0.05] bg-[#121212] overflow-y-auto p-6 space-y-7 custom-scrollbar">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold">Filtros</h2>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-green hover:underline">Limpiar</button>
            )}
          </div>

          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-[#1E1E1E] border border-white/10 px-3 py-1.5 rounded-sm text-2xs font-bold text-primary/70">
              EDAD: {ageMin} - {ageMax}
            </div>
            {activePos && (
              <div className="flex items-center gap-2 bg-[#1E1E1E] border border-white/10 px-3 py-1.5 rounded-sm text-2xs font-bold text-primary/70">
                POS: {activePos} <X size={12} className="text-muted cursor-pointer hover:text-primary" onClick={() => setActivePos("")} />
              </div>
            )}
          </div>
        </div>

        {/* Age UI */}
        <div className="space-y-4 pt-2">
          <p className="text-base font-bold uppercase tracking-tight">Edad</p>
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-2xs text-muted font-bold">MÍNIMA</label>
              <input type="number" min="15" max="45" value={ageMin} onChange={(e) => setAgeMin(e.target.value)}
                className="bg-[#1A1A1A] border border-white/10 rounded-md px-3 py-2 text-center text-base font-bold text-primary outline-none focus:border-green transition-colors w-full" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-2xs text-muted font-bold">MÁXIMA</label>
              <input type="number" min="15" max="45" value={ageMax} onChange={(e) => setAgeMax(e.target.value)}
                className="bg-[#1A1A1A] border border-white/10 rounded-md px-3 py-2 text-center text-base font-bold text-primary outline-none focus:border-green transition-colors w-full" />
            </div>
          </div>
        </div>

        {/* Position UI */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold uppercase tracking-tight">Posición</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["PORTERO", "DEFENSA", "MEDIOCAMPO", "DELANTERO"].map(p => (
              <button
                key={p}
                onClick={() => setActivePos(activePos === p ? "" : p)}
                className={`text-2xs py-3 rounded border font-black tracking-tight transition-all
                            ${activePos === p
                    ? "bg-[#182622] border-green text-green"
                    : "bg-[#1A1A1A] border-white/5 text-[#555555] hover:text-primary/60"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main List Area ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top Header/Search */}
        <header className="h-20 flex items-center px-10 gap-10 bg-[#121212]">

          <div className="flex-1 max-w-2xl relative">
            <div className="flex items-center bg-[#1A1A1A] rounded-full border border-white/[0.08] h-11 px-6 group transition-all focus-within:border-white/20">
              <div className="flex items-center gap-2 pr-4 border-r border-white/5 text-base font-bold text-green mr-4 cursor-pointer hover:text-green-dark">
                Jugadores
              </div>
              <input value={inputQ} onChange={(e) => setInputQ(e.target.value)} placeholder="Buscar por apellido..." className="bg-transparent border-none outline-none text-sm text-primary w-full placeholder:text-[#444444]" />
              {inputQ ? (
                <X size={18} className="text-muted cursor-pointer hover:text-primary" onClick={() => setInputQ("")} />
              ) : (
                <Search size={18} className="text-[#444444] cursor-pointer group-focus-within:text-primary transition-colors" />
              )}
            </div>
          </div>
        </header>

        {/* Players List */}
        <div className="flex-1 overflow-auto bg-[#0A0A0A] custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-green w-8 h-8" />
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <Search size={40} className="mb-4 text-muted" />
              <p className="text-lg font-bold">No se encontraron jugadores</p>
              <p className="text-sm text-muted">Ajusta los filtros de búsqueda</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0A0A0A] z-10 border-b border-white/[0.04] shadow-sm">
                <tr className="text-2xs text-primary/40 uppercase font-bold tracking-[2px]">
                  <th className="px-10 py-5 w-10"></th>
                  <th className="px-4 py-5 font-black">Apellido ↑↓</th>
                  <th className="px-4 py-5 font-black">Edad ↑↓</th>
                  <th className="px-4 py-5 font-black">Match ↑↓</th>
                  <th className="px-4 py-5 font-black">Equipo actual ↑↓</th>
                  <th className="px-4 py-5 font-black">Pos. Principal ↑↓</th>
                  <th className="px-4 py-5 font-black">Vto contrato ↑↓</th>
                  <th className="px-4 py-5 font-black">Altura (m) ↑↓</th>
                  <th className="px-4 py-5 font-black">Pie ↑↓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {players.map((p, i) => (
                  <tr key={p.id} className="group hover:bg-white-[0.015] transition-all animate-fade-in duration-300">
                    <td className="px-10 py-[18px]">
                      <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-100 transition-all">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-[18px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shadow-md">
                          {p.photoUrl
                            ? <Image src={p.photoUrl} alt="" layout="fill" className="object-cover" unoptimized />
                            : <div className="flex items-center justify-center h-full text-xs opacity-40">{p.name[0]}</div>
                          }
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-base font-bold text-primary/90 group-hover:text-green transition-colors">{p.name}</p>
                          <p className="text-xs text-primary/30 font-medium">{p.nationality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-[18px] text-base font-bold text-primary/60">
                      {p.age}
                    </td>
                    <td className="px-4 py-[18px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-white/5 flex items-center justify-center relative bg-[#121212]">
                          <svg className="absolute inset-0 p-0 transform -rotate-90 w-full h-full">
                            <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#00E094" strokeWidth="2" strokeDasharray="100" strokeDashoffset={100 - (p.matchPct || 0)} className="opacity-100" />
                          </svg>
                          <span className="text-sm font-bold text-primary">{p.matchPct}</span>
                        </div>
                        <span className="text-sm font-bold text-primary/30">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-[18px]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1">
                          {p.team?.logoUrl
                            ? <Image src={p.team.logoUrl} alt="" width={18} height={18} unoptimized />
                            : <div className="w-4 h-4 rounded-full bg-white/10" />
                          }
                        </div>
                        <span className="text-base text-primary/70 truncate max-w-[160px] font-medium">{p.team?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-[18px]">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-sm bg-green opacity-70" />
                        <span className="text-sm text-primary/50 uppercase font-black tracking-tight">{p.position}</span>
                      </div>
                    </td>
                    <td className="px-4 py-[18px] text-base font-bold text-primary/30 truncate">
                      {p.contractUntil || "12/27"}
                    </td>
                    <td className="px-4 py-[18px] text-base font-bold text-primary/30">
                      {p.height || "1.8 mts"}
                    </td>
                    <td className="px-4 py-[18px] text-base font-bold text-primary/30 uppercase">
                      {p.foot || "Der"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
