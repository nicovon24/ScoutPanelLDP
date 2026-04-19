"use client";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { Loader2, X, Search, Plus, RotateCcw, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import RadarChartComponent from "@/components/charts/RadarChart";
import HeatmapField from "@/components/player/HeatmapField";
import PlayerStatsTable, { getCompareColsStyle } from "@/components/player/PlayerStatsTable";
import { useScoutStore } from "@/store/useScoutStore";
import { Select, SelectItem } from "@nextui-org/react";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";

// ─── helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob?: string) {
  if (!dob) return "—";
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "—";
    return `${Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25))} años`;
  } catch { return "—"; }
}
function posStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}
const num = (v: any) => { const f = parseFloat(String(v ?? "0")); return isNaN(f) ? 0 : f; };

// ─── colors ───────────────────────────────────────────────────────────────────
const COLORS = [
  { text: "text-[#00e87a]", bg: "bg-[#00e87a]", glow: "bg-[#00e87a]/5", hex: "#00e87a" },
  { text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]", glow: "bg-[#8b5cf6]/5", hex: "#8b5cf6" },
  { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]", glow: "bg-[#f59e0b]/5", hex: "#f59e0b" },
];

interface SearchHit { id: number; name: string; position: string; photoUrl?: string; nationality?: string; }

// ─── PlayerSearch ─────────────────────────────────────────────────────────────
function PlayerSearch({ onSelect, excludeIds = [] }: { onSelect: (p: SearchHit) => void; excludeIds?: number[] }) {
  const [q, setQ] = useState("");
  const [results, setRes] = useState<SearchHit[]>([]);
  const [loading, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const fetch = useCallback(async (val: string) => {
    setLoad(true);
    try {
      const { data } = await api.get<{ players: SearchHit[] }>(`/players/search?q=${encodeURIComponent(val)}`);
      setRes(data.players.filter(p => !excludeIds.includes(p.id)));
      setOpen(true);
    } catch { setRes([]); } finally { setLoad(false); }
  }, [excludeIds]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (q.length >= 2) { clearTimeout(timer.current); timer.current = setTimeout(() => fetch(q), 280); }
    else if (q.length > 0) setRes([]);
    return () => clearTimeout(timer.current);
  }, [q, fetch]);

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-[9px]">
        {loading ? <Loader2 size={13} className="animate-spin text-muted" /> : <Search size={13} className="text-muted" />}
        <input value={q} onChange={e => setQ(e.target.value)}
          onFocus={() => { if (!q && !results.length) fetch(""); else setOpen(true); }}
          placeholder="Buscar jugador…"
          className="flex-1 bg-transparent text-[12px] font-bold text-primary placeholder:text-muted outline-none"
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }}><X size={12} className="text-muted" /></button>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-surface-2 border border-border rounded-[10px] shadow-xl z-50 max-h-[280px] overflow-y-auto w-[260px]">
          {results.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setQ(""); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-border hover:bg-white/[0.04] transition-colors text-left last:border-0">
              <div className="w-7 h-7 rounded-full bg-input flex items-center justify-center text-[10px] font-black text-secondary shrink-0 overflow-hidden">
                {p.photoUrl ? <Image src={p.photoUrl} alt={p.name} width={28} height={28} className="object-cover" unoptimized /> : p.name[0]}
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

// ─── Section header (only used for heatmap / radar in compare) ────────────────
function SectionHeader({ label, colsStyle }: { label: string; colsStyle: string }) {
  return (
    <div className="grid border-t border-border bg-surface-2" style={{ gridTemplateColumns: colsStyle }}>
      <div
        style={{ gridColumn: "1 / -1" }}
        className="px-4 py-2.5 text-[9.5px] font-black tracking-[0.16em] uppercase text-muted"
      >
        {label}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { compareList } = useScoutStore();
  const [slots, setSlots] = useState<(SearchHit | null)[]>([null, null]);

  useEffect(() => {
    setSlots(prev => {
      const next = [...prev];
      for (let i = 0; i < 3; i++) { if (i < compareList.length) next[i] = compareList[i]; }
      return next.slice(0, Math.max(2, compareList.length, prev.length));
    });
  }, [compareList]);

  const [playersData, setPlayersData] = useState<(any | null)[]>([null, null, null]);
  const [loadings, setLoadings]       = useState<boolean[]>([false, false, false]);
  const [seasons, setSeasons]         = useState<any[]>([]);
  const [selectedSeasonId, setSeason] = useState<string>("");

  useEffect(() => {
    api.get("/seasons").then(({ data }) => {
      setSeasons(data);
      if (data.length) setSeason(String(data[0].id));
    }).catch(() => {});
  }, []);

  const fetchPlayer = useCallback(async (id: number, idx: number) => {
    setLoadings(p => { const o = [...p]; o[idx] = true; return o; });
    try {
      const { data } = await api.get(`/players/${id}`);
      setPlayersData(prev => { const o = [...prev]; o[idx] = data; return o; });
    } catch {
      setPlayersData(prev => { const o = [...prev]; o[idx] = null; return o; });
    } finally {
      setLoadings(p => { const o = [...p]; o[idx] = false; return o; });
    }
  }, []);

  useEffect(() => {
    slots.forEach((s, i) => {
      if (s) { if (!playersData[i] || playersData[i].id !== s.id) fetchPlayer(s.id, i); }
      else if (playersData[i]) setPlayersData(prev => { const o = [...prev]; o[i] = null; return o; });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const activeCount = slots.filter(Boolean).length;
  const canAdd      = slots.length < 3 && activeCount === slots.length;
  const slotCount   = slots.length;

  function handleClearSlot(idx: number) {
    const p = slots[idx];
    const next = [...slots];
    if (next.length === 3 && idx === 2) next.pop(); else next[idx] = null;
    setSlots(next);
    setPlayersData(prev => { const o = [...prev]; o[idx] = null; return o; });
    if (p) useScoutStore.getState().removeFromCompare(p.id);
  }

  const validIndices = slots.map((s, i) => (s && playersData[i] && !loadings[i] ? i : -1)).filter(i => i !== -1);
  const bothLoaded   = validIndices.length >= 2;

  const getStat = (i: number): any => {
    if (!playersData[i]?.stats) return {};
    if (!selectedSeasonId)
      return [...playersData[i].stats].sort((a: any, b: any) => (b.season?.year || 0) - (a.season?.year || 0))[0] ?? {};
    return playersData[i].stats.find((s: any) => String(s.seasonId) === selectedSeasonId) ?? {};
  };

  // ── Grid column definitions ─────────────────────────────────────────────────
  // Shared content grid matches PlayerStatsTable internal layout (130px label + 44px VS + 1fr slots)
  const contentCols = getCompareColsStyle(slotCount);
  // Header grid: same as content + optional Add button column
  const headerCols  = `${contentCols}${canAdd ? ` 64px` : ""}`;

  // Heatmap canvas sizes (approximate, accounting for label + VS cols + padding)
  const hmW = slotCount >= 3 ? 420 : 640;
  const hmH = slotCount >= 3 ? 250 : 380;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1500px] mx-auto pb-16 sm:pb-20 pt-4 sm:pt-6 animate-fade-in font-sans">
      <p className="text-[11px] font-bold text-muted mb-3">Player comparison</p>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-[20px] font-black tracking-[-0.01em] text-primary uppercase">
          Comparación de jugadores
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="w-[160px] sm:w-[180px]">
            <Select aria-label="Seleccionar temporada" placeholder="Temporada"
              selectedKeys={selectedSeasonId ? [selectedSeasonId] : []}
              onSelectionChange={(keys: any) => { const v = Array.from(keys)[0]; if (v) setSeason(String(v)); }}
              classNames={{ trigger: `${sharedSelectClasses.trigger} h-[38px]`, value: sharedSelectClasses.value, popoverContent: sharedSelectClasses.popoverContent }}
              startContent={<Calendar size={14} className="text-green" />}>
              {seasons.map(s => <SelectItem key={String(s.id)} textValue={s.name} classNames={sharedSelectItemClasses}>{s.name}</SelectItem>)}
            </Select>
          </div>
          {slots.some(Boolean) && (
            <button
              onClick={() => { setSlots([null, null]); setPlayersData([null, null, null]); useScoutStore.getState().clearCompare(); }}
              className="flex items-center gap-[6px] border border-danger/25 rounded-lg px-3 sm:px-4 h-[38px] text-danger text-[12px] font-extrabold hover:bg-danger/10 transition-all">
              <RotateCcw size={12} strokeWidth={2.5} /> <span className="hidden sm:inline">Limpiar todo</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[14px] overflow-hidden">

        {/* ── Horizontal scroll wrapper for the comparison table ─────────── */}
        <div className="overflow-x-auto">
        <div className="min-w-[540px]">

        {/* ── HEADER: player slots ──────────────────────────────────────────── */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: headerCols }}>
          {/* Empty label column */}
          <div className="border-r border-border bg-surface-2/20" />

          {slots.map((s, i) => {
            const data = playersData[i];
            const load = loadings[i];
            const C    = COLORS[i];
            const stat = data ? getStat(i) : null;
            const rv   = stat?.sofascoreRating ? parseFloat(stat.sofascoreRating) : null;
            const ratingColor = rv ? rv >= 7.5 ? C.text : rv >= 7.0 ? "text-gold" : "text-muted" : "text-muted";

            return (
              <Fragment key={i}>
                {i > 0 && (
                  <div className="flex items-center justify-center border-l border-r border-border bg-surface-2">
                    <span className="text-[12px] font-black text-muted tracking-[0.08em]">VS</span>
                  </div>
                )}

                <div className={`relative flex flex-col items-center p-[36px_20px_28px] text-center border-r border-border last:border-0 ${!s ? "z-20" : "z-10"} transition-all duration-300`}>
                  {/* accent glow */}
                  {s && !load && (
                    <div className="absolute inset-0 pointer-events-none opacity-50"
                      style={{ background: `radial-gradient(circle at 50% 35%, ${C.hex}33 0%, transparent 80%)` }} />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-[4px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${C.hex}40 50%, transparent)` }} />

                  {/* Remove button */}
                  {s && !load && (
                    <div className="absolute top-5 left-0 right-0 flex justify-center z-20">
                      <button onClick={() => handleClearSlot(i)}
                        className="flex items-center gap-1.5 text-white/40 hover:text-danger hover:bg-danger/10 px-3 py-1 rounded-full transition-all group">
                        <X size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Sacar</span>
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {!s ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 w-full">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${C.glow} ${C.text}`}>
                        <Search size={22} strokeWidth={2.5} />
                      </div>
                      <p className="text-[11px] font-extrabold text-muted uppercase tracking-wide">
                        {i === 0 ? "Primer jugador" : i === 1 ? "Segundo jugador" : "Tercer jugador"}
                      </p>
                      <div className="w-full max-w-[220px] z-50">
                        <PlayerSearch
                          onSelect={p => { const n = [...slots]; n[i] = p; setSlots(n); useScoutStore.getState().addToCompare(p as any); }}
                          excludeIds={slots.filter(Boolean).map(s => (s as SearchHit).id)}
                        />
                      </div>
                    </div>
                  ) : load ? (
                    <div className="flex items-center justify-center min-h-[200px] w-full">
                      <Loader2 className={`animate-spin ${C.text}`} size={26} />
                    </div>
                  ) : data && (
                    <div className="flex flex-col items-center z-10 w-full pt-2">
                      <div className="relative mb-4">
                        <div className="absolute -inset-1.5 rounded-full border-[3px]"
                          style={{ borderColor: C.hex, boxShadow: `0 0 20px ${C.hex}33` }} />
                        <div className="w-20 h-20 rounded-full bg-surface-3 flex items-center justify-center text-2xl font-black text-secondary overflow-hidden relative z-10">
                          {data.photoUrl ? <Image src={data.photoUrl} alt={data.name} width={80} height={80} className="object-cover w-full h-full" unoptimized /> : data.name?.[0]}
                        </div>
                      </div>
                      <Link href={`/players/${data.id}`} className="hover:opacity-80 transition-opacity">
                        <p className="text-[16px] font-black tracking-[-0.01em] leading-[1.2] mb-2">{data.name}</p>
                      </Link>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`text-[9px] font-black tracking-[0.1em] uppercase px-2 py-[3px] rounded bg-white/[0.04] ${C.text}`}>{data.position}</span>
                        {rv && (
                          <div className="flex items-center gap-1 bg-white/[0.06] rounded px-2 py-[3px]">
                            <span className={`text-[13px] font-black ${ratingColor}`}>{rv.toFixed(1)}</span>
                            <span className="text-[9px] font-bold text-muted uppercase">Rating</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-muted mb-3">{data.team?.name || "Sin Equipo"} · {data.nationality}</p>
                      <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/5 rounded-full px-3 py-1.5">
                        <span className="text-[10px] font-black text-secondary">
                          {seasons.find(sz => String(sz.id) === selectedSeasonId)?.name || "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}

          {/* Add slot button */}
          {canAdd && (
            <button onClick={() => setSlots([...slots, null])}
              className="flex flex-col items-center justify-center border-l border-border bg-surface-2 hover:bg-surface-3 transition-colors group p-5 gap-2">
              <div className="w-9 h-9 rounded-full border-[1.5px] border-dashed border-border flex items-center justify-center text-muted group-hover:border-[#00e87a]/40 group-hover:text-[#00e87a] transition-all">
                <Plus size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-muted tracking-[0.1em] uppercase"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Agregar</span>
            </button>
          )}
        </div>

        {/* ── COMPARISON CONTENT ────────────────────────────────────────────── */}
        {!bothLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-[14px] bg-surface-2 border border-border flex items-center justify-center text-muted">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="9" height="18" rx="2" /><rect x="13" y="3" width="9" height="18" rx="2" />
              </svg>
            </div>
            <p className="text-[15px] font-black text-secondary">Seleccioná al menos 2 jugadores</p>
            <p className="text-[12px] font-semibold text-muted max-w-[290px] leading-[1.75]">
              Buscá en los slots de arriba para comparar estadísticas. Podés agregar un{" "}
              <strong className="text-secondary font-extrabold">tercer jugador</strong> con el botón +.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Sticky legend */}
            <div className="flex items-center justify-center gap-6 p-3.5 border-b border-border bg-surface-2/50 backdrop-blur-sm sticky top-0 z-30">
              {slots.map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[11px] font-extrabold transition-opacity ${s ? "text-secondary opacity-100" : "text-muted opacity-40"}`}>
                  <div className="w-[10px] h-[10px] rounded-[3px]" style={{ background: COLORS[i].hex }} />
                  {s ? playersData[i]?.name?.split(" ")[0] || "…" : `Slot ${i + 1}`}
                </div>
              ))}
            </div>

            {/* Info General */}
            <PlayerStatsTable
              entries={validIndices.map(i => ({
                player: playersData[i],
                stat: getStat(i),
                color: COLORS[i],
              }))}
              onlySections={["Info General"]}
            />

            {/* Heatmap — right after Info General */}
            <SectionHeader label="Mapas de calor" colsStyle={contentCols} />
            <div className="grid border-t border-border bg-surface-2" style={{ gridTemplateColumns: contentCols }}>
              <div className="border-r border-border" />
              {slots.map((_, i) => (
                <Fragment key={i}>
                  {i > 0 && <div className="border-r border-border" />}
                  <div className="p-3 border-r border-border last:border-0">
                    {playersData[i] && !loadings[i] ? (
                      <HeatmapField
                        grid={getStat(i).heatmapData as number[][] | undefined}
                        width={hmW}
                        height={hmH}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded-xl border border-border/40 bg-white/[0.02]"
                        style={{ minHeight: hmH / 2 }}
                      >
                        {loadings[i]
                          ? <Loader2 size={20} className={`animate-spin ${COLORS[i].text}`} />
                          : <p className="text-[11px] text-muted">—</p>}
                      </div>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>

            {/* Remaining stats (everything except Info General) */}
            <PlayerStatsTable
              entries={validIndices.map(i => ({
                player: playersData[i],
                stat: getStat(i),
                color: COLORS[i],
              }))}
              excludeSections={["Info General"]}
            />

            {/* Radar section */}
            <SectionHeader label="Radar de Rendimiento" colsStyle={contentCols} />
            <div className="border-t border-border bg-surface-2 p-6 sm:p-10 flex justify-center">
              <div className="w-full max-w-[min(100%,880px)] px-1 sm:px-2">
                <RadarChartComponent
                  data={[
                    { metric: "Goles",      playerA: Math.min(100, num(getStat(0).goals) * 5),                     playerB: Math.min(100, num(getStat(1).goals) * 5),                     playerC: slotCount > 2 ? Math.min(100, num(getStat(2).goals) * 5) : undefined },
                    { metric: "xG/PJ",      playerA: Math.min(100, num(getStat(0).xgPerGame) * 100),               playerB: Math.min(100, num(getStat(1).xgPerGame) * 100),               playerC: slotCount > 2 ? Math.min(100, num(getStat(2).xgPerGame) * 100) : undefined },
                    { metric: "Asistencias", playerA: Math.min(100, num(getStat(0).assists) * 8),                  playerB: Math.min(100, num(getStat(1).assists) * 8),                   playerC: slotCount > 2 ? Math.min(100, num(getStat(2).assists) * 8) : undefined },
                    { metric: "xA/PJ",      playerA: Math.min(100, num(getStat(0).xaPerGame) * 100),               playerB: Math.min(100, num(getStat(1).xaPerGame) * 100),               playerC: slotCount > 2 ? Math.min(100, num(getStat(2).xaPerGame) * 100) : undefined },
                    { metric: "Pases clave", playerA: Math.min(100, num(getStat(0).keyPassesPerGame) * 35),         playerB: Math.min(100, num(getStat(1).keyPassesPerGame) * 35),         playerC: slotCount > 2 ? Math.min(100, num(getStat(2).keyPassesPerGame) * 35) : undefined },
                    { metric: "Pases%",     playerA: Math.min(100, num(getStat(0).passAccuracyPct)),               playerB: Math.min(100, num(getStat(1).passAccuracyPct)),               playerC: slotCount > 2 ? Math.min(100, num(getStat(2).passAccuracyPct)) : undefined },
                    { metric: "Regates%",   playerA: Math.min(100, num(getStat(0).dribbleSuccessRate)),             playerB: Math.min(100, num(getStat(1).dribbleSuccessRate)),             playerC: slotCount > 2 ? Math.min(100, num(getStat(2).dribbleSuccessRate)) : undefined },
                    { metric: "Tackles",    playerA: Math.min(100, num(getStat(0).tackles) * 1.5),                 playerB: Math.min(100, num(getStat(1).tackles) * 1.5),                 playerC: slotCount > 2 ? Math.min(100, num(getStat(2).tackles) * 1.5) : undefined },
                    { metric: "Intercep.",  playerA: Math.min(100, num(getStat(0).interceptions) * 2),             playerB: Math.min(100, num(getStat(1).interceptions) * 2),             playerC: slotCount > 2 ? Math.min(100, num(getStat(2).interceptions) * 2) : undefined },
                    { metric: "Recuper.",   playerA: Math.min(100, num(getStat(0).recoveries) * 0.8),              playerB: Math.min(100, num(getStat(1).recoveries) * 0.8),              playerC: slotCount > 2 ? Math.min(100, num(getStat(2).recoveries) * 0.8) : undefined },
                    { metric: "Aéreos%",    playerA: Math.min(100, num(getStat(0).aerialDuelsWonPct)),             playerB: Math.min(100, num(getStat(1).aerialDuelsWonPct)),             playerC: slotCount > 2 ? Math.min(100, num(getStat(2).aerialDuelsWonPct)) : undefined },
                    { metric: "Rating",     playerA: Math.min(100, num(getStat(0).sofascoreRating) * 11),          playerB: Math.min(100, num(getStat(1).sofascoreRating) * 11),          playerC: slotCount > 2 ? Math.min(100, num(getStat(2).sofascoreRating) * 11) : undefined },
                  ]}
                  nameA={playersData[0]?.name} nameB={playersData[1]?.name} nameC={playersData[2]?.name}
                  colorA={COLORS[0].hex} colorB={COLORS[1].hex} colorC={COLORS[2].hex}
                />
              </div>
            </div>
          </div>
        )}

        {/* close min-w + overflow wrappers */}
        </div>
        </div>
      </div>
    </div>
  );
}
