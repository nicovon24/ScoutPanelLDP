"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, X, Search, Plus, RotateCcw, Calendar, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import RadarChartComponent from "@/components/charts/RadarChart";
import { useScoutStore } from "@/store/useScoutStore";
import { Select, SelectItem } from "@nextui-org/react";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";

function calcAge(dob?: string) {
  if (!dob) return "—";
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "—";
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} años`;
  } catch { return "—"; }
}

function posStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}

function fmtVal(v: any, dec = 0) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return dec > 0 ? n.toFixed(dec) : String(n);
}

const num = (v: any) => {
  const f = parseFloat(String(v ?? "0"));
  return isNaN(f) ? 0 : f;
};

const COLORS = [
  { name: "green", text: "text-[#00e87a]", bg: "bg-[#00e87a]", glow: "bg-[#00e87a]/5", border: "border-[#00e87a]/25", accentBg: "bg-[#00e87a]/10", hex: "#00e87a" },
  { name: "purple", text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]", glow: "bg-[#8b5cf6]/5", border: "border-[#8b5cf6]/25", accentBg: "bg-[#8b5cf6]/10", hex: "#8b5cf6" },
  { name: "gold", text: "text-[#f59e0b]", bg: "bg-[#f59e0b]", glow: "bg-[#f59e0b]/5", border: "border-[#f59e0b]/25", accentBg: "bg-[#f59e0b]/10", hex: "#f59e0b" },
];

interface SearchHit { id: number; name: string; position: string; photoUrl?: string; nationality?: string; }

function PlayerSearch({ onSelect, excludeIds = [] }: { onSelect: (p: SearchHit) => void, excludeIds?: number[] }) {
  const [q, setQ] = useState("");
  const [results, setRes] = useState<SearchHit[]>([]);
  const [loading, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPlayers = useCallback(async (val: string) => {
    setLoad(true);
    try {
      const { data } = await api.get<{ players: SearchHit[] }>(`/players/search?q=${encodeURIComponent(val)}`);
      const filtered = data.players.filter(p => !excludeIds.includes(p.id));
      setRes(filtered);
      setOpen(true);
    } catch {
      setRes([]);
    } finally {
      setLoad(false);
    }
  }, [excludeIds]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (q.length >= 2) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchPlayers(q), 280);
    } else if (q.length > 0) {
      setRes([]);
    }
    return () => clearTimeout(timerRef.current);
  }, [q, fetchPlayers]);

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-[9px]">
        {loading ? <Loader2 size={13} className="animate-spin text-muted" /> : <Search size={13} className="text-muted" />}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (q === "" && results.length === 0) fetchPlayers("");
            else setOpen(true);
          }}
          placeholder="Buscar jugador..."
          className="flex-1 bg-transparent text-[12px] font-bold text-primary placeholder:text-muted outline-none"
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }}><X size={12} className="text-muted" /></button>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border-md rounded-[10px] shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto w-[250px] sm:w-[100%] max-w-[280px]">
          {results.map((p) => (
            <button key={p.id} onClick={() => { onSelect(p); setQ(""); setOpen(false); }} className="w-full flex items-center gap-[9px] px-[12px] py-[9px] border-b border-border hover:bg-white/[0.04] transition-colors text-left last:border-0">
              <div className="w-[30px] h-[30px] rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-black text-secondary shrink-0 overflow-hidden">
                {p.photoUrl ? <Image src={p.photoUrl} alt={p.name} width={30} height={30} className="object-cover w-full h-full" unoptimized /> : p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-extrabold text-primary truncate">{p.name}</p>
                <p className="text-[10px] font-semibold text-muted mt-[1px] truncate">{p.position} · {p.nationality}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompRow({
  label, vals, nums, activeColors, unit = "", higherIsBetter = true
}: {
  label: string; vals: string[]; nums: number[]; activeColors: string[]; unit?: string; higherIsBetter?: boolean;
}) {
  const maxAbs = Math.max(...nums, 0.001);
  const winVal = higherIsBetter ? Math.max(...nums) : Math.min(...nums);
  const validNums = nums.filter(n => !isNaN(n));
  const isTie = validNums.length > 0 && nums.every(n => n === nums[0]);

  return (
    <div className="flex items-stretch border-t border-border hover:bg-white/[0.016] transition-colors">
      <div className="w-[180px] shrink-0 flex items-center px-4 border-r border-border text-[11px] font-bold text-muted">
        {label}
      </div>
      <div className="flex-1 flex">
        {vals.map((v, i) => {
          const nVal = nums[i];
          const win = !isTie && nVal === winVal && nVal !== 0;
          const colorClass = activeColors[i];
          const bgClass = colorClass ? colorClass.replace("text-", "bg-") : "";
          const pct = Math.min(100, (nVal / maxAbs) * 100);

          return (
            <div key={i} className="flex-1 flex items-center px-4 gap-2 border-r border-border last:border-0 py-2.5">
              <span className={`text-[15px] font-black tracking-[-0.01em] ${win ? colorClass : (isTie ? 'text-primary' : 'text-primary/[0.65]')} min-w-[38px]`}>
                {v}{unit}
              </span>
              {win && <span className={`text-[9px] font-black ${colorClass}`}>▲</span>}
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden max-w-[80px] ml-auto">
                <div className={`h-full rounded-full transition-all duration-500 ${bgClass}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GeneralRow({ label, vals }: { label: string; vals: string[] }) {
  return (
    <div className="flex items-stretch border-t border-border hover:bg-white/[0.016] transition-colors">
      <div className="w-[180px] shrink-0 flex items-center px-4 border-r border-border text-[11px] font-bold text-muted">
        {label}
      </div>
      <div className="flex-1 flex">
        {vals.map((v, i) => (
          <div key={i} className="flex-1 flex items-center px-4 gap-2 border-r border-border last:border-0 py-2.5">
            <span className="text-[13px] font-black text-primary">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { compareList } = useScoutStore();

  const [slots, setSlots] = useState<(SearchHit | null)[]>([null, null, null]);

  // Synchronize state with store on initial load and when store changes externally
  useEffect(() => {
    setSlots(prev => {
      const newSlots = [...prev];
      for (let i = 0; i < 3; i++) {
        if (i < compareList.length) newSlots[i] = compareList[i];
        else if (!newSlots[i] && i === 0 && prev.length === 2) newSlots[i] = null; // Maintain length
      }
      return newSlots.slice(0, Math.max(2, compareList.length, prev.length));
    });
  }, [compareList]);

  const [playersData, setPlayersData] = useState<(any | null)[]>([null, null, null]);
  const [loadings, setLoadings] = useState<boolean[]>([false, false, false]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  useEffect(() => {
    api.get("/seasons").then(({ data }) => {
      setSeasons(data);
      if (data.length > 0) setSelectedSeasonId(String(data[0].id));
    }).catch(() => { });
  }, []);

  const fetchPlayer = useCallback(async (id: number, idx: number) => {
    setLoadings(p => { const o = [...p]; o[idx] = true; return o; });
    try {
      const { data } = await api.get(`/players/${id}`);
      setPlayersData(prev => {
        const o = [...prev];
        o[idx] = data;
        return o;
      });
    } catch {
      setPlayersData(prev => { const o = [...prev]; o[idx] = null; return o; });
    } finally {
      setLoadings(p => { const o = [...p]; o[idx] = false; return o; });
    }
  }, []);

  useEffect(() => {
    slots.forEach((s, i) => {
      if (s) {
        if (!playersData[i] || playersData[i].id !== s.id) {
          fetchPlayer(s.id, i);
        }
      } else {
        if (playersData[i] !== null) {
          setPlayersData(prev => { const o = [...prev]; o[i] = null; return o; });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const activeCount = slots.filter(Boolean).length;
  const canAdd = slots.length < 3 && activeCount === slots.length;

  function handleClearSlot(idx: number) {
    const p = slots[idx];
    const newSlots = [...slots];
    if (newSlots.length === 3 && idx === 2) newSlots.pop();
    else newSlots[idx] = null;

    setSlots(newSlots);
    setPlayersData(prev => { const o = [...prev]; o[idx] = null; return o; });

    if (p) useScoutStore.getState().removeFromCompare(p.id);
  }

  function handleAddSlot() {
    if (slots.length < 3) {
      setSlots([...slots, null]);
    }
  }

  const validIndices = slots.map((s, i) => (s && playersData[i] && !loadings[i] ? i : -1)).filter(i => i !== -1);
  const bothLoaded = validIndices.length >= 2;

  const getStat = (i: number): any => {
    if (!playersData[i]?.stats) return {};
    if (!selectedSeasonId) {
      return playersData[i].stats.sort((a: any, b: any) => (b.season?.year || 0) - (a.season?.year || 0))[0] ?? {};
    }
    return playersData[i].stats.find((s: any) => String(s.seasonId) === selectedSeasonId) ?? {};
  };

  const currentCols = [];
  slots.forEach((_, i) => {
    if (i > 0) currentCols.push('52px');
    currentCols.push('1fr');
  });
  if (canAdd) currentCols.push('80px'); // Slightly wider add button slot

  return (
    <div className="max-w-[1500px] mx-auto pb-[80px] pt-[30px] px-[18px] animate-fade-in font-sans">
      <div className="flex items-center gap-[5px] text-[11px] font-bold text-muted mb-[16px]">
        <span>Player comparison</span>
      </div>

      <div className="flex items-end justify-between mb-[20px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-primary uppercase">Comparación de jugadores</h1>

        </div>

        <div className="flex items-center gap-3">
          <div className="w-[180px]">
            <Select
              aria-label="Seleccionar temporada"
              placeholder="Temporada"
              selectedKeys={selectedSeasonId ? [selectedSeasonId] : []}
              onSelectionChange={(keys: any) => {
                const val = Array.from(keys)[0];
                if (val) setSelectedSeasonId(String(val));
              }}
              classNames={{
                trigger: `${sharedSelectClasses.trigger} h-[38px]`,
                value: sharedSelectClasses.value,
                popoverContent: sharedSelectClasses.popoverContent,
              }}
              startContent={<Calendar size={14} className="text-green" />}
            >
              {seasons.map((s) => (
                <SelectItem key={String(s.id)} textValue={s.name} classNames={sharedSelectItemClasses}>
                  {s.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {slots.some(Boolean) && (
            <button
              onClick={() => {
                setSlots([null, null]);
                setPlayersData([null, null, null]);
                useScoutStore.getState().clearCompare();
              }}
              className="flex items-center gap-[6px] bg-transparent border border-danger/25 rounded-[8px] px-[14px] h-[38px] text-danger text-[12px] font-extrabold hover:bg-danger/10 hover:border-danger/45 transition-all"
            >
              <RotateCcw size={12} strokeWidth={2.5} /> <span className="hidden sm:inline">Limpiar todo</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[14px]">
        {/* SLOTS GRID */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: currentCols.join(' ') }}>
          {slots.map((s, i) => {
            const data = playersData[i];
            const load = loadings[i];
            const C = COLORS[i];
            const stat = data ? getStat(i) : null;
            const ratingVal = stat?.sofascoreRating ? parseFloat(stat.sofascoreRating) : null;
            const ratingColor = ratingVal ? ratingVal >= 7.5 ? C.text : ratingVal >= 7.0 ? "text-gold" : "text-muted" : "text-muted";

            return (
              <div key={i} className="contents">
                {i > 0 && <div className="flex items-center justify-center border-l border-r border-border bg-surface-2"><span className="text-[12px] font-black text-muted tracking-[0.08em]">VS</span></div>}

                <div className={`relative flex flex-col items-center p-[40px_24px_32px] gap-0 text-center h-full ${!s ? 'z-20' : 'z-10'} transition-all duration-300`}>
                  {s && !load && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-50 transition-all duration-700"
                      style={{
                        background: `radial-gradient(circle at 50% 35%, ${C.hex}33 0%, transparent 80%)`,
                      }}
                    />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: `linear-gradient(90deg, transparent, ${C.hex}40 50%, transparent)` }} />

                  {s && !load && (
                    <div className="absolute top-6 left-0 right-0 mx-auto w-fit h-[32px] px-3 z-20">
                      <button
                        onClick={() => handleClearSlot(i)}
                        className="flex items-center justify-center gap-2 text-white/40 hover:text-danger hover:bg-danger/10 px-3 py-1 rounded-full transition-all group"
                      >
                        <X size={16} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Sacar</span>
                      </button>
                    </div>
                  )}

                  {!s ? (
                    <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 w-full bg-transparent">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${C.glow} ${C.text}`}><Search size={24} strokeWidth={2.5} /></div>
                      <div className="text-[12px] font-extrabold text-muted mb-2 tracking-wide uppercase">{i === 0 ? 'Primer jugador' : i === 1 ? 'Segundo jugador' : 'Tercer jugador'}</div>
                      <div className="w-[95%] z-50">
                        <PlayerSearch
                          onSelect={(p) => {
                            const n = [...slots];
                            n[i] = p;
                            setSlots(n);
                            useScoutStore.getState().addToCompare(p as any);
                          }}
                          excludeIds={slots.filter(sz => sz !== null).map(sz => (sz as SearchHit).id)}
                        />
                      </div>
                    </div>
                  ) : load ? (
                    <div className="flex flex-col items-center justify-center min-h-[220px] w-full"><Loader2 className={`animate-spin ${C.text}`} size={28} /></div>
                  ) : data && (
                    <div className="flex flex-col items-center z-10 w-full pt-2">
                      <div className="relative mb-5">
                        <div className="absolute -inset-1.5 rounded-full border-[3px] shadow-[0_0_20px]" style={{ borderColor: C.hex, boxShadow: `0 0 20px ${C.hex}33` }} />
                        <div className="w-[88px] h-[88px] rounded-full bg-surface-3 flex items-center justify-center text-[28px] font-black text-secondary overflow-hidden relative z-10">
                          {data.photoUrl ? <Image src={data.photoUrl} alt={data.name} width={88} height={88} className="object-cover w-full h-full" unoptimized /> : (data.name?.[0] || "?")}
                        </div>
                      </div>
                      <Link href={`/players/${data.id}`} className="hover:opacity-80 transition-opacity"><p className={`text-[17px] font-black tracking-[-0.01em] leading-[1.2] mb-[8px]`}>{data.name}</p></Link>

                      <div className="flex items-center justify-center gap-[6px] mb-2">
                        <span className={`text-[9px] font-black tracking-[0.1em] uppercase px-[7px] py-[3px] rounded-[5px] bg-white/[0.04] ${C.text}`}>{data.position}</span>
                        {ratingVal && (
                          <div className="flex items-center gap-[3px] bg-white/[0.06] rounded-[5px] px-[8px] py-[3px]">
                            <span className={`text-[14px] font-black ${ratingColor}`}>{ratingVal.toFixed(1)}</span>
                            <span className="text-[9px] font-bold text-muted uppercase tracking-[0.08em]">Rating</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-bold text-muted mb-[6px]">{data.team?.name || "Sin Equipo"} · {data.nationality}</div>

                      <div className="flex items-center gap-[12px] mb-[12px]">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest leading-none mb-1">Altura</span>
                          <span className="text-[13px] font-black text-primary leading-none">{data.heightCm ? `${data.heightCm}cm` : "—"}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/5" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest leading-none mb-1">Peso</span>
                          <span className="text-[13px] font-black text-primary leading-none">{data.weightKg ? `${data.weightKg}kg` : "—"}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/5" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest leading-none mb-1">Pie</span>
                          <span className="text-[13px] font-black text-primary leading-none">{data.preferredFoot || "—"}</span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-[6px] bg-white/[0.04] border border-white/5 rounded-full px-[12px] py-1.5">
                        <span className="text-[10px] font-black text-secondary tracking-tight">
                          {seasons.find(sz => String(sz.id) === selectedSeasonId)?.name || "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {canAdd && (
            <button onClick={handleAddSlot} className="flex flex-col items-center justify-center border-l border-border bg-surface-2 hover:bg-surface-3 transition-colors group p-[20px_10px] gap-2">
              <div className="w-9 h-9 rounded-full border-[1.5px] border-dashed border-border-md flex items-center justify-center text-muted group-hover:border-[#00e87a]/40 group-hover:text-[#00e87a] transition-all"><Plus size={16} strokeWidth={2.5} /></div>
              <div className="text-[9px] font-extrabold text-muted tracking-[0.1em] uppercase text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Agregar</div>
            </button>
          )}
        </div>

        {/* COMPARISON Content */}
        {!bothLoaded ? (
          <div className="flex flex-col items-center justify-center py-[60px] pb-[56px] gap-[12px] text-center">
            <div className="w-[58px] h-[58px] rounded-[14px] bg-surface-2 border border-border flex items-center justify-center text-muted"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="9" height="18" rx="2" /><rect x="13" y="3" width="9" height="18" rx="2" /></svg></div>
            <p className="text-[15px] font-black text-secondary">Seleccioná al menos 2 jugadores</p>
            <p className="text-[12px] font-semibold text-muted max-w-[290px] leading-[1.75]">Buscá en los slots de arriba para comparar estadísticas lado a lado. Podés agregar un <strong className="text-secondary font-extrabold">tercer jugador</strong> usando el botón +.</p>
          </div>
        ) : (
          <div className="animate-fade-in relative">
            {/* Legend Map */}
            <div className="flex items-center justify-center gap-[24px] p-[14px] border-b border-border bg-surface-2/50 backdrop-blur-sm sticky top-0 z-30">
              {slots.map((s, i) => (
                <div key={i} className={`flex items-center gap-[6px] text-[11px] font-extrabold transition-opacity duration-300 ${s ? 'text-secondary opacity-100' : 'text-muted opacity-40'}`}>
                  <div className="w-[10px] h-[10px] rounded-[3px]" style={{ background: COLORS[i].hex }} />
                  {s ? playersData[i]?.name?.split(" ")[0] || "..." : `Slot ${i + 1}`}
                </div>
              ))}
            </div>

            {/* SECTIONS */}
            {[
              {
                label: "Info General", type: "general", rows: [
                  { l: "Edad", fn: (vi: number) => calcAge(playersData[vi]?.dateOfBirth) },
                  { l: "Valor Mercado", fn: (vi: number) => playersData[vi]?.marketValueM ? `€${fmtVal(playersData[vi].marketValueM, 1)}M` : "—" },
                  { l: "Altura", fn: (vi: number) => playersData[vi]?.heightCm ? `${playersData[vi].heightCm} cm` : "—" },
                  { l: "Pie hábil", fn: (vi: number) => playersData[vi]?.preferredFoot || "—" }
                ]
              },
              {
                label: "Ataque", rows: [
                  { l: "Goles", k: "goals" }, { l: "Asistencias", k: "assists" }, { l: "xG / Partido", k: "xgPerGame", d: 2 }, { l: "Tiros / Partido", k: "shotsPerGame", d: 2 }, { l: "Tiros al arco %", k: "shotsOnTargetPct", d: 1, u: "%" }
                ]
              },
              {
                label: "Pases & Creación", rows: [
                  { l: "xA / Partido", k: "xaPerGame", d: 2 }, { l: "Pases clave / Partido", k: "keyPassesPerGame", d: 2 }, { l: "Precisión pases %", k: "passAccuracyPct", d: 1, u: "%" }
                ]
              },
              {
                label: "Defensa", rows: [
                  { l: "Tackles", k: "tackles" }, { l: "Intercepciones", k: "interceptions" }, { l: "Recuperaciones", k: "recoveries" }, { l: "Duelos aéreos %", k: "aerialDuelsWonPct", d: 1, u: "%" }
                ]
              },
              {
                label: "Regates", rows: [
                  { l: "Regates exitosos/PJ", k: "successfulDribblesPerGame", d: 2 }, { l: "Tasa de éxito %", k: "dribbleSuccessRate", d: 1, u: "%" }
                ]
              },
              {
                label: "Disciplina", rows: [
                  { l: "Tarjetas amarillas", k: "yellowCards", lower: true }, { l: "Tarjetas rojas", k: "redCards", lower: true }
                ]
              },
              {
                label: "Participación", rows: [
                  { l: "Partidos jugados", k: "matchesPlayed" }, { l: "Minutos jugados", k: "minutesPlayed" }
                ]
              },
              {
                label: "Radar de Rendimiento", type: "radar"
              }
            ].map((sec, sIdx) => (
              <div key={sIdx}>
                <div className="flex items-stretch bg-surface-2 border-t border-border">
                  <div className="w-[180px] shrink-0 flex items-center justify-center p-[12px_0] border-r border-border text-[9.5px] font-black tracking-[0.16em] uppercase text-muted whitespace-nowrap">{sec.label}</div>
                  <div className="flex-1 flex">
                    {slots.map((_, i) => <div key={i} className="flex-1 border-r border-border last:border-0 py-3" />)}
                  </div>
                </div>

                {sec.type === "radar" ? (
                  <div className="border-t border-border bg-surface-2 p-[32px_28px_40px]">
                    <div className="flex justify-center max-w-[400px] mx-auto">
                      <RadarChartComponent
                        data={[
                          { metric: "Goles", playerA: Math.min(100, num(getStat(0).goals) * 6), playerB: Math.min(100, num(getStat(1).goals) * 6), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).goals) * 6) : undefined },
                          { metric: "Asist.", playerA: Math.min(100, num(getStat(0).assists) * 10), playerB: Math.min(100, num(getStat(1).assists) * 10), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).assists) * 10) : undefined },
                          { metric: "xG", playerA: Math.min(100, num(getStat(0).xgPerGame) * 150), playerB: Math.min(100, num(getStat(1).xgPerGame) * 150), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).xgPerGame) * 150) : undefined },
                          { metric: "Pases%", playerA: Math.min(100, num(getStat(0).passAccuracyPct)), playerB: Math.min(100, num(getStat(1).passAccuracyPct)), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).passAccuracyPct)) : undefined },
                          { metric: "Tackles", playerA: Math.min(100, num(getStat(0).tackles) * 2), playerB: Math.min(100, num(getStat(1).tackles) * 2), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).tackles) * 2) : undefined },
                          { metric: "Recup.", playerA: Math.min(100, num(getStat(0).recoveries) * 1.5), playerB: Math.min(100, num(getStat(1).recoveries) * 1.5), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).recoveries) * 1.5) : undefined },
                          { metric: "Regates%", playerA: Math.min(100, num(getStat(0).dribbleSuccessRate)), playerB: Math.min(100, num(getStat(1).dribbleSuccessRate)), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).dribbleSuccessRate)) : undefined },
                          { metric: "Aéreos%", playerA: Math.min(100, num(getStat(0).aerialDuelsWonPct)), playerB: Math.min(100, num(getStat(1).aerialDuelsWonPct)), playerC: slots.length > 2 ? Math.min(100, num(getStat(2).aerialDuelsWonPct)) : undefined },
                        ]}
                        nameA={playersData[0]?.name}
                        nameB={playersData[1]?.name}
                        nameC={playersData[2]?.name}
                        colorA={COLORS[0].hex}
                        colorB={COLORS[1].hex}
                        colorC={COLORS[2].hex}
                      />
                    </div>
                  </div>
                ) : sec.type === "general" ? (
                  sec.rows?.map((r, rIdx) => (
                    <GeneralRow key={rIdx} label={r.l} vals={slots.map((_, vi) => r.fn?.(vi) || "—")} />
                  ))
                ) : (
                  sec.rows?.map((r: any, rIdx) => {
                    const vals = slots.map((_, vi) => fmtVal(getStat(vi)[r.k], r.d));
                    const nums = slots.map((_, vi) => num(getStat(vi)[r.k]));
                    const activeCols = slots.map((_, vi) => COLORS[vi].text);
                    return <CompRow key={rIdx} label={r.l} vals={vals} nums={nums} activeColors={activeCols} unit={r.u} higherIsBetter={!r.lower} />;
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
