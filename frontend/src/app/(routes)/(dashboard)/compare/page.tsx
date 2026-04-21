"use client";
import { useState, useEffect, useCallback, Fragment } from "react";
import { Loader2, X, Plus, RotateCcw, Calendar, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const RadarChartComponent = dynamic(() => import("@/components/charts/RadarChart"), {
  loading: () => <ChartSkeleton height={320} />,
  ssr: false,
});
const HeatmapField = dynamic(() => import("@/components/player/HeatmapField"), {
  loading: () => <ChartSkeleton height={180} />,
  ssr: false,
});
import PlayerStatsTable, { getCompareColsStyle } from "@/components/player/PlayerStatsTable";
import PlayerSearch from "@/components/compare/PlayerSearch";
import { useScoutStore } from "@/store/useScoutStore";
import { Select, SelectItem } from "@nextui-org/react";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";
import { buildMultiRadar } from "@/lib/radarNorm";
import { PLAYER_COLORS } from "@/lib/playerStats";
import api from "@/lib/api";
import type { SearchHit } from "@/types";

const COLORS = PLAYER_COLORS;

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

/** Ancho mínimo del grid de comparación (alineado con LABEL_W / VS_W / columnas en PlayerStatsTable) */
function compareGridMinPx(playerColCount: number): number {
  const LABEL = 130;
  const PLAYER = 140;
  const VS = 44;
  if (playerColCount < 1) return LABEL;
  return LABEL + playerColCount * PLAYER + Math.max(0, playerColCount - 1) * VS;
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
  // Content grid is based on loaded players only — keeps PlayerStatsTable,
  // heatmap and SectionHeaders in sync (all use the same column template).
  const validCount  = validIndices.length;
  const contentCols = getCompareColsStyle(validCount);
  // Header grid shows all slots (including empty) + optional Add button
  const headerCols  = `${getCompareColsStyle(slotCount)}${canAdd ? ` 64px` : ""}`;

  // Heatmap canvas sizes scale with the number of loaded players
  const hmW = validCount >= 3 ? 420 : 640;
  const hmH = validCount >= 3 ? 250 : 380;

  // Un solo ancho mínimo para header + tablas + heatmap (hmW puede ser 640px; si no entra, el scroll es el de afuera)
  const headerMinPx = compareGridMinPx(slotCount) + (canAdd ? 64 : 0);
  const statsMinPx  = bothLoaded && validCount >= 2 ? compareGridMinPx(validCount) : 0;
  const heatmapRowMinPx = bothLoaded && validCount >= 2 ? 130 + hmW : 0;
  const innerMinPx  = Math.max(headerMinPx, statsMinPx || headerMinPx, heatmapRowMinPx, 320);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1500px] mx-auto w-full min-w-0 pb-16 sm:pb-20 pt-4 sm:pt-6 animate-fade-in font-sans">
      <p className="text-[11px] font-bold text-muted mb-3">Player comparison</p>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 gap-3 sm:gap-4">
        <h1 className="text-base sm:text-[20px] font-black tracking-[-0.01em] text-primary uppercase">
          Comparación de jugadores
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 sm:flex-none sm:w-[180px]">
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
              title="Limpiar todo"
              className="flex items-center gap-[6px] border border-danger/25 rounded-lg px-3 sm:px-4 h-[38px] text-danger text-[12px] font-extrabold hover:bg-danger/10 transition-all whitespace-nowrap">
              <RotateCcw size={12} strokeWidth={2.5} />
              <span className="hidden sm:inline">Limpiar todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile scroll hint */}
      <p className="text-[11px] text-muted text-center sm:hidden mb-2 flex items-center justify-center gap-1">
        <span>←</span> deslizá para ver todo <span>→</span>
      </p>

      {/* overflow-hidden cortaba el scroll; un solo overflow-x-auto para todo el bloque */}
      <div
        className="bg-surface border border-border rounded-base w-full min-w-0
                   overflow-x-auto overflow-y-visible overscroll-x-contain
                   [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y]"
      >
        <div style={{ minWidth: `${innerMinPx}px` }} className="min-w-0">

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

                <div className={`relative flex flex-col items-center p-[20px_12px_18px] sm:p-[36px_20px_28px] text-center border-r border-border last:border-0 ${!s ? "z-20" : "z-10"} transition-all duration-300`}>
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
                        <span className="text-2xs font-black uppercase tracking-widest hidden group-hover:inline">Sacar</span>
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {!s ? (
                    <div className="flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] gap-2 sm:gap-3 w-full">
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${C.glow} ${C.text}`}>
                        <Search size={18} strokeWidth={2.5} />
                      </div>
                      <p className="text-2xs sm:text-[11px] font-extrabold text-muted uppercase tracking-wide">
                        {i === 0 ? "Primer jugador" : i === 1 ? "Segundo jugador" : "Tercer jugador"}
                      </p>
                      <div className="w-full max-w-[180px] sm:max-w-[220px] z-50">
                        <PlayerSearch
                          onSelect={p => { const n = [...slots]; n[i] = p; setSlots(n); useScoutStore.getState().addToCompare(p as any); }}
                          excludeIds={slots.filter(Boolean).map(s => (s as SearchHit).id)}
                        />
                      </div>
                    </div>
                  ) : load ? (
                    <div className="flex items-center justify-center min-h-[160px] sm:min-h-[200px] w-full">
                      <Loader2 className={`animate-spin ${C.text}`} size={22} />
                    </div>
                  ) : data && (
                    <div className="flex flex-col items-center z-10 w-full pt-2">
                      <div className="relative mb-3 sm:mb-4">
                        <div className="absolute -inset-1.5 rounded-full border-[3px]"
                          style={{ borderColor: C.hex, boxShadow: `0 0 20px ${C.hex}33` }} />
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-surface-3 flex items-center justify-center text-xl sm:text-2xl font-black text-secondary overflow-hidden relative z-10">
                          {data.photoUrl ? <Image src={data.photoUrl} alt={data.name} width={80} height={80} className="object-cover w-full h-full" unoptimized /> : data.name?.[0]}
                        </div>
                      </div>
                      <Link href={`/players/${data.id}`} className="hover:opacity-80 transition-opacity">
                        <p className="text-sm sm:text-[16px] font-black tracking-[-0.01em] leading-[1.2] mb-1.5 sm:mb-2">{data.name}</p>
                      </Link>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 flex-wrap justify-center">
                        <span className={`text-2xs font-black tracking-[0.1em] uppercase px-2 py-[3px] rounded bg-white/[0.04] ${C.text}`}>{data.position}</span>
                        {rv && (
                          <div className="flex items-center gap-1 bg-white/[0.06] rounded px-2 py-[3px]">
                            <span className={`text-[12px] sm:text-[13px] font-black ${ratingColor}`}>{rv.toFixed(1)}</span>
                            <span className="text-2xs font-bold text-muted uppercase">Rating</span>
                          </div>
                        )}
                      </div>
                      <p className="text-2xs sm:text-[11px] font-bold text-muted mb-2 sm:mb-3 truncate max-w-full px-2">
                        {data.team?.name || "Sin Equipo"} · {data.nationality}
                      </p>
                      <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5">
                        <span className="text-2xs sm:text-2xs font-black text-secondary">
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
              <span className="text-2xs font-extrabold text-muted tracking-[0.1em] uppercase"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Agregar</span>
            </button>
          )}
        </div>

        {/* ── COMPARISON CONTENT ────────────────────────────────────────────── */}
        {!bothLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-base bg-surface-2 border border-border flex items-center justify-center text-muted">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="9" height="18" rx="2" /><rect x="13" y="3" width="9" height="18" rx="2" />
              </svg>
            </div>
            <p className="text-md font-black text-secondary">Seleccioná al menos 2 jugadores</p>
            <p className="text-[12px] font-semibold text-muted max-w-[290px] leading-[1.75]">
              Buscá en los slots de arriba para comparar estadísticas. Podés agregar un{" "}
              <strong className="text-secondary font-extrabold">tercer jugador</strong> con el botón +.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Sticky legend — outside scroll so stays fixed while scrolling */}
            <div className="flex items-center justify-center gap-6 p-3.5 border-b border-border bg-surface-2/50 backdrop-blur-sm sticky top-0 z-30">
              {slots.map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[11px] font-extrabold transition-opacity ${s ? "text-secondary opacity-100" : "text-muted opacity-40"}`}>
                  <div className="w-2xs h-2xs rounded-[3px]" style={{ background: COLORS[i].hex }} />
                  {s ? playersData[i]?.name?.split(" ")[0] || "…" : `Slot ${i + 1}`}
                </div>
              ))}
            </div>

            {/* Stats + heatmap: el scroll horizontal es el del contenedor padre (una sola capa) */}
            <div className="relative">
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
                {validIndices.map((dataIdx, arrIdx) => (
                  <Fragment key={dataIdx}>
                    {arrIdx > 0 && <div className="border-r border-border" />}
                    <div className="p-3 border-r border-border last:border-0">
                      <HeatmapField
                        grid={getStat(dataIdx).heatmapData as number[][] | undefined}
                        width={hmW}
                        height={hmH}
                      />
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

              <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-[#141414] to-transparent
                              pointer-events-none sm:hidden rounded-br-base" />
            </div>

            {/* Radar section — full width, no horizontal scroll needed */}
            <SectionHeader label="Radar de Rendimiento" colsStyle={contentCols} />
            <div className="border-t border-border bg-surface-2 p-6 sm:p-10 flex justify-center">
              <div className="w-full max-w-[min(100%,880px)] px-1 sm:px-2">
                <RadarChartComponent
                  data={buildMultiRadar(
                    getStat(0),
                    getStat(1),
                    slotCount > 2 ? getStat(2) : undefined,
                  )}
                  nameA={playersData[0]?.name} nameB={playersData[1]?.name} nameC={playersData[2]?.name}
                  colorA={COLORS[0].hex} colorB={COLORS[1].hex} colorC={COLORS[2].hex}
                />
              </div>
            </div>
          </div>
        )}

        </div>
        </div>
    </div>
  );
}
