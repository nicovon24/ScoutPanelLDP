"use client";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { Loader2, X, Search, Plus, RotateCcw, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import RadarChartComponent from "@/components/charts/RadarChart";
import HeatmapField from "@/components/player/HeatmapField";
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
function fmtVal(v: any, dec = 0) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "—" : dec > 0 ? n.toFixed(dec) : String(n);
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

// ─── Layout constants ─────────────────────────────────────────────────────────
const LABEL_W = 130; // px – left label column
const VS_W    = 44;  // px – VS separator column

// ─── Row components (now receive arrays indexed by slot position) ──────────────
function SectionHeader({ label, colsStyle }: { label: string; colsStyle: string }) {
  return (
    <div className="grid border-t border-border bg-surface-2" style={{ gridTemplateColumns: colsStyle }}>
      <div style={{ gridColumn: "1 / -1" }}
        className="px-4 py-2.5 text-[9.5px] font-black tracking-[0.16em] uppercase text-muted">
        {label}
      </div>
    </div>
  );
}

function StatRow({
  label, vals, nums, colors, unit = "", higherIsBetter = true, colsStyle, slotCount,
}: {
  label: string; vals: string[]; nums: number[]; colors: string[]; unit?: string;
  higherIsBetter?: boolean; colsStyle: string; slotCount: number;
}) {
  const maxAbs = Math.max(...nums, 0.001);
  const winVal = higherIsBetter ? Math.max(...nums) : Math.min(...nums);
  const isTie = nums.every(n => n === nums[0]);

  return (
    <div className="grid border-t border-border hover:bg-white/[0.016] transition-colors"
      style={{ gridTemplateColumns: colsStyle }}>
      {/* label */}
      <div className="flex items-center px-4 py-2.5 border-r border-border text-[11px] font-bold text-muted">
        {label}
      </div>
      {Array.from({ length: slotCount }).map((_, i) => {
        const v = vals[i] ?? "—";
        const n = nums[i] ?? 0;
        const win = !isTie && n === winVal && n !== 0;
        const colorCls = colors[i] ?? "";
        const bgCls = colorCls.replace("text-", "bg-");
        const pct = Math.min(100, (n / maxAbs) * 100);
        return (
          <Fragment key={i}>
            {i > 0 && <div className="border-r border-border" />}
            <div className="flex items-center gap-2 px-4 py-2.5 border-r border-border last:border-0">
              <span className={`text-[15px] font-black tracking-[-0.01em] min-w-[38px]
                ${win ? colorCls : isTie ? "text-primary" : "text-primary/60"}`}>
                {v}{unit}
              </span>
              {win && <span className={`text-[9px] font-black ${colorCls}`}>▲</span>}
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden max-w-[72px] ml-auto">
                <div className={`h-full rounded-full transition-all duration-500 ${bgCls}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function GeneralStatRow({
  label, vals, colsStyle, slotCount,
}: { label: string; vals: string[]; colsStyle: string; slotCount: number }) {
  return (
    <div className="grid border-t border-border hover:bg-white/[0.016] transition-colors"
      style={{ gridTemplateColumns: colsStyle }}>
      <div className="flex items-center px-4 py-2.5 border-r border-border text-[11px] font-bold text-muted">
        {label}
      </div>
      {Array.from({ length: slotCount }).map((_, i) => (
        <Fragment key={i}>
          {i > 0 && <div className="border-r border-border" />}
          <div className="flex items-center px-4 py-2.5 border-r border-border last:border-0">
            <span className="text-[13px] font-black text-primary">{vals[i] ?? "—"}</span>
          </div>
        </Fragment>
      ))}
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
  // Player slots: 1fr for each, VS_W px between them
  const playerColsTemplate = slots
    .map((_, i) => (i === 0 ? "1fr" : `${VS_W}px 1fr`))
    .join(" ");

  // Shared content grid (label + player cols)
  const contentCols = `${LABEL_W}px ${playerColsTemplate}`;

  // Header grid: same as content + optional Add button column
  const headerCols  = `${LABEL_W}px ${playerColsTemplate}${canAdd ? ` 64px` : ""}`;

  // Heatmap canvas sizes (approximate, accounting for label + VS cols + padding)
  const hmW = slotCount >= 3 ? 420 : 640;
  const hmH = slotCount >= 3 ? 250 : 380;

  // ── Sections definition ─────────────────────────────────────────────────────
  type StatRowDef   = { l: string; k: string; d?: number; u?: string; lower?: boolean };
  type GeneralRowDef = { l: string; fn: (vi: number) => string };
  type Section =
    | { label: string; type: "general"; rows: GeneralRowDef[] }
    | { label: string; type: "stat";    rows: StatRowDef[] }
    | { label: string; type: "heatmap" }
    | { label: string; type: "radar" };

  const sections: Section[] = [
    {
      label: "Info General", type: "general", rows: [
        { l: "Edad",         fn: vi => calcAge(playersData[vi]?.dateOfBirth) },
        { l: "Valor Mercado",fn: vi => playersData[vi]?.marketValueM ? `€${fmtVal(playersData[vi].marketValueM, 1)}M` : "—" },
        { l: "Altura",       fn: vi => playersData[vi]?.heightCm ? `${playersData[vi].heightCm} cm` : "—" },
        { l: "Pie hábil",    fn: vi => playersData[vi]?.preferredFoot || "—" },
      ],
    },
    { label: "Mapas de calor", type: "heatmap" },
    {
      label: "Ataque", type: "stat", rows: [
        { l: "Goles", k: "goals" }, { l: "Asistencias", k: "assists" },
        { l: "xG / Partido", k: "xgPerGame", d: 2 }, { l: "Tiros / Partido", k: "shotsPerGame", d: 2 },
        { l: "Tiros al arco %", k: "shotsOnTargetPct", d: 1, u: "%" },
      ],
    },
    {
      label: "Pases & Creación", type: "stat", rows: [
        { l: "xA / Partido", k: "xaPerGame", d: 2 }, { l: "Pases clave / PJ", k: "keyPassesPerGame", d: 2 },
        { l: "Precisión pases %", k: "passAccuracyPct", d: 1, u: "%" },
      ],
    },
    {
      label: "Defensa", type: "stat", rows: [
        { l: "Tackles", k: "tackles" }, { l: "Intercepciones", k: "interceptions" },
        { l: "Recuperaciones", k: "recoveries" }, { l: "Duelos aéreos %", k: "aerialDuelsWonPct", d: 1, u: "%" },
      ],
    },
    {
      label: "Regates", type: "stat", rows: [
        { l: "Regates exitosos/PJ", k: "successfulDribblesPerGame", d: 2 },
        { l: "Tasa de éxito %", k: "dribbleSuccessRate", d: 1, u: "%" },
      ],
    },
    {
      label: "Disciplina", type: "stat", rows: [
        { l: "Tarjetas amarillas", k: "yellowCards", lower: true },
        { l: "Tarjetas rojas", k: "redCards", lower: true },
      ],
    },
    {
      label: "Participación", type: "stat", rows: [
        { l: "Partidos jugados", k: "matchesPlayed" }, { l: "Minutos jugados", k: "minutesPlayed" },
      ],
    },
    { label: "Radar de Rendimiento", type: "radar" },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1500px] mx-auto pb-[80px] pt-[30px] px-[18px] animate-fade-in font-sans">
      <p className="text-[11px] font-bold text-muted mb-4">Player comparison</p>

      <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
        <h1 className="text-[20px] font-black tracking-[-0.01em] text-primary uppercase">
          Comparación de jugadores
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-[180px]">
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
              className="flex items-center gap-[6px] border border-danger/25 rounded-lg px-4 h-[38px] text-danger text-[12px] font-extrabold hover:bg-danger/10 transition-all">
              <RotateCcw size={12} strokeWidth={2.5} /> <span className="hidden sm:inline">Limpiar todo</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[14px] overflow-hidden">

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

            {/* Sections */}
            {sections.map((sec, sIdx) => {
              if (sec.type === "heatmap") {
                return (
                  <div key={sIdx}>
                    <SectionHeader label={sec.label} colsStyle={contentCols} />
                    {/* heatmap row: empty label cell + one HeatmapField per player column */}
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
                              <div className="flex items-center justify-center rounded-xl border border-border/40 bg-white/[0.02]"
                                style={{ minHeight: hmH / 2 }}>
                                {loadings[i]
                                  ? <Loader2 size={20} className={`animate-spin ${COLORS[i].text}`} />
                                  : <p className="text-[11px] text-muted">—</p>}
                              </div>
                            )}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sec.type === "radar") {
                return (
                  <div key={sIdx}>
                    <SectionHeader label={sec.label} colsStyle={contentCols} />
                    <div className="border-t border-border bg-surface-2 p-6 sm:p-10 flex justify-center">
                      <div className="w-full max-w-[min(100%,880px)] px-1 sm:px-2">
                        <RadarChartComponent
                          data={[
                            { metric: "Goles",    playerA: Math.min(100, num(getStat(0).goals) * 6), playerB: Math.min(100, num(getStat(1).goals) * 6),    playerC: slotCount > 2 ? Math.min(100, num(getStat(2).goals) * 6) : undefined },
                            { metric: "Asist.",   playerA: Math.min(100, num(getStat(0).assists) * 10), playerB: Math.min(100, num(getStat(1).assists) * 10), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).assists) * 10) : undefined },
                            { metric: "xG",       playerA: Math.min(100, num(getStat(0).xgPerGame) * 150), playerB: Math.min(100, num(getStat(1).xgPerGame) * 150), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).xgPerGame) * 150) : undefined },
                            { metric: "Pases%",   playerA: Math.min(100, num(getStat(0).passAccuracyPct)), playerB: Math.min(100, num(getStat(1).passAccuracyPct)), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).passAccuracyPct)) : undefined },
                            { metric: "Tackles",  playerA: Math.min(100, num(getStat(0).tackles) * 2), playerB: Math.min(100, num(getStat(1).tackles) * 2), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).tackles) * 2) : undefined },
                            { metric: "Recup.",   playerA: Math.min(100, num(getStat(0).recoveries) * 1.5), playerB: Math.min(100, num(getStat(1).recoveries) * 1.5), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).recoveries) * 1.5) : undefined },
                            { metric: "Regates%", playerA: Math.min(100, num(getStat(0).dribbleSuccessRate)), playerB: Math.min(100, num(getStat(1).dribbleSuccessRate)), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).dribbleSuccessRate)) : undefined },
                            { metric: "Aéreos%",  playerA: Math.min(100, num(getStat(0).aerialDuelsWonPct)), playerB: Math.min(100, num(getStat(1).aerialDuelsWonPct)), playerC: slotCount > 2 ? Math.min(100, num(getStat(2).aerialDuelsWonPct)) : undefined },
                          ]}
                          nameA={playersData[0]?.name} nameB={playersData[1]?.name} nameC={playersData[2]?.name}
                          colorA={COLORS[0].hex} colorB={COLORS[1].hex} colorC={COLORS[2].hex}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (sec.type === "general") {
                return (
                  <div key={sIdx}>
                    <SectionHeader label={sec.label} colsStyle={contentCols} />
                    {sec.rows.map((r, rIdx) => (
                      <GeneralStatRow
                        key={rIdx}
                        label={r.l}
                        vals={slots.map((_, vi) => r.fn(vi))}
                        colsStyle={contentCols}
                        slotCount={slotCount}
                      />
                    ))}
                  </div>
                );
              }

              // type === "stat"
              return (
                <div key={sIdx}>
                  <SectionHeader label={sec.label} colsStyle={contentCols} />
                  {sec.rows.map((r: StatRowDef, rIdx) => (
                    <StatRow
                      key={rIdx}
                      label={r.l}
                      vals={slots.map((_, vi) => fmtVal(getStat(vi)[r.k], r.d))}
                      nums={slots.map((_, vi) => num(getStat(vi)[r.k]))}
                      colors={slots.map((_, vi) => COLORS[vi].text)}
                      unit={r.u}
                      higherIsBetter={!r.lower}
                      colsStyle={contentCols}
                      slotCount={slotCount}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
