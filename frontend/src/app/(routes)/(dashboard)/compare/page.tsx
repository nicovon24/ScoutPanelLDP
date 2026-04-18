"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, X, Search, Plus, RotateCcw, User, Flag, Euro, Footprints } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import RadarChartComponent from "@/components/charts/RadarChart";
import { useScoutStore } from "@/store/useScoutStore";

/* ── Helpers ──────────────────────────────────── */
function calcAge(dob?: string) {
  if (!dob) return "—";
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} años`;
}
function posStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}
function fmtVal(v: string | number | null | undefined, dec = 0) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return dec > 0 ? n.toFixed(dec) : String(n);
}
function winner(a: number, b: number, higherIsBetter = true): "A" | "B" | "tie" {
  if (a === b) return "tie";
  return (higherIsBetter ? a > b : a < b) ? "A" : "B";
}

/* ── Inline player search (for slots) ─────────── */
interface SearchHit {
  id: number; name: string; position: string;
  photoUrl?: string; nationality?: string;
}

function PlayerSearch({ onSelect }: { onSelect: (p: SearchHit) => void }) {
  const [q, setQ] = useState("");
  const [results, setRes] = useState<SearchHit[]>([]);
  const [loading, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback((val: string) => {
    if (val.length < 2) { setRes([]); setOpen(false); return; }
    setLoad(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get<{ players: SearchHit[] }>(`/players/search?q=${encodeURIComponent(val)}`);
        setRes(data.players);
        setOpen(true);
      } catch { /* */ }
      finally { setLoad(false); }
    }, 280);
  }, []);

  useEffect(() => { search(q); }, [q, search]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-2.5
                      focus-within:border-green/60 transition-colors">
        {loading
          ? <div className="w-3.5 h-3.5 border-2 border-green/30 border-t-green rounded-full animate-spin" />
          : <Search size={13} className="text-muted" />}
        <input
          ref={inputRef} value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jugador..."
          className="flex-1 bg-transparent text-base text-primary placeholder:text-muted outline-none"
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }}><X size={12} className="text-muted" /></button>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border
                        rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {results.map((p) => (
            <button key={p.id} onClick={() => { onSelect(p); setQ(""); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card-2 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-input border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                {p.photoUrl
                  ? <Image src={p.photoUrl} alt={p.name} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                  : <span className="text-xs font-bold text-muted">{p.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-primary truncate">{p.name}</p>
                <p className="text-xs text-muted">{p.nationality}</p>
              </div>
              <span className={`badge text-2xs ${posStyle(p.position)}`}>{p.position}</span>
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 px-4 py-4 text-center">
          <p className="text-sm text-muted">Sin resultados para &ldquo;{q}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

/* ── General Info Pill ────────────────────────── */
function InfoPill({ icon, label, value, accentClass }: {
  icon: React.ReactNode; label: string; value: string; accentClass: string
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
      <span className={`flex-shrink-0 ${accentClass} opacity-60`}>{icon}</span>
      <span className="text-xs text-muted w-[90px] flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-primary truncate">{value}</span>
    </div>
  );
}

/* ── Player Slot ──────────────────────────────── */
function PlayerSlot({
  player, fullData, loading, color, slotLabel, onSelect, onClear
}: {
  player: any | null;
  fullData: any | null;
  loading: boolean;
  color: "green" | "purple";
  slotLabel: string;
  onSelect: (p: SearchHit) => void;
  onClear: () => void;
}) {
  const borderCol = color === "green" ? "border-green/25" : "border-purple/25";
  const bgGlow = color === "green" ? "bg-green/5" : "bg-purple/5";
  const accentText = color === "green" ? "text-green" : "text-purple";
  const accentBg = color === "green" ? "bg-green/10" : "bg-purple/10";
  const accentClass = color === "green" ? "text-green" : "text-purple";

  if (!player) {
    return (
      <div className={`card border ${borderCol} ${bgGlow} flex flex-col items-center justify-center gap-4 min-h-[180px] p-5`}>
        <div className={`w-12 h-12 rounded-full ${accentBg} flex items-center justify-center`}>
          <Plus size={24} className={accentText} />
        </div>
        <p className="text-sm text-secondary text-center uppercase">{slotLabel}</p>
        <div className="w-full">
          <PlayerSearch onSelect={onSelect} />
        </div>
      </div>
    );
  }

  const stat = fullData?.stats?.sort((a: any, b: any) => b.season?.year - a.season?.year)[0];
  const ratingVal = stat ? parseFloat(stat.sofascoreRating ?? "0") : null;
  const ratingColor = ratingVal
    ? ratingVal >= 7.5 ? "text-green" : ratingVal >= 7.0 ? "text-gold" : "text-secondary"
    : "text-muted";

  return (
    <div className={`card border ${borderCol} ${bgGlow} relative p-5 transition-all`}>
      {/* Clear btn */}
      <button onClick={onClear}
        className="absolute top-3 right-3 w-6 h-6 rounded flex items-center justify-center
                         text-muted hover:text-danger hover:bg-danger/10 transition-colors">
        <X size={13} />
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 size={20} className={`animate-spin ${accentText}`} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Avatar + Name section ── */}
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center gap-2">
              <Link href={`/players/${player.id}`}>
                <div className={`w-20 h-20 rounded-xl bg-input border ${borderCol} overflow-hidden
                                flex items-center justify-center cursor-pointer
                                hover:opacity-90 transition-opacity`}>
                  {player.photoUrl
                    ? <Image src={player.photoUrl} alt={player.name} width={80} height={80}
                      className="object-cover w-full h-full" unoptimized />
                    : <span className="text-3xl font-black text-muted">{player.name[0]}</span>}
                </div>
              </Link>
              <div>
                <Link href={`/players/${player.id}`}>
                  <p className={`font-black text-md text-primary hover:${accentText} transition-colors leading-tight`}>
                    {player.name}
                  </p>
                </Link>
                <span className={`badge text-2xs mt-1 inline-flex ${posStyle(player.position)}`}>
                  {player.position}
                </span>
              </div>
            </div>

            {/* Rating badge */}
            {ratingVal != null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${accentBg}`}>
                <span className={`text-md font-black ${ratingColor}`}>{ratingVal.toFixed(1)}</span>
                <span className="text-2xs text-muted">Rating</span>
              </div>
            )}
          </div>

          {/* ── General info block ── */}
          {fullData && (
            <div className={`rounded-xl border ${borderCol} px-3 py-1`}>
              <p className={`text-2xs font-black uppercase tracking-wider ${accentClass} mb-1 pt-2`}>
                Información general
              </p>
              <InfoPill
                icon={<User size={12} />}
                label="Edad"
                value={calcAge(fullData.dateOfBirth)}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<span className="text-sm">📍</span>}
                label="Posición"
                value={fullData.position ?? "—"}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<span className="text-sm">🏟</span>}
                label="Equipo"
                value={fullData.team?.name ?? "—"}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<Flag size={12} />}
                label="País"
                value={fullData.nationality ?? "—"}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<Euro size={12} />}
                label="Valor"
                value={`€${fmtVal(fullData.marketValueM, 1)}M`}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<Footprints size={12} />}
                label="Pie hábil"
                value={fullData.preferredFoot ?? "—"}
                accentClass={accentClass}
              />
              <InfoPill
                icon={<span className="text-sm">📏</span>}
                label="Altura"
                value={fullData.heightCm ? `${fullData.heightCm} cm` : "—"}
                accentClass={accentClass}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Comparison Row ───────────────────────────── */
function CompRow({
  label, valA, valB, numA, numB, unit = "", higherIsBetter = true
}: {
  label: string; valA: string; valB: string;
  numA: number; numB: number; unit?: string; higherIsBetter?: boolean;
}) {
  const w = winner(numA, numB, higherIsBetter);
  const winA = w === "A";
  const winB = w === "B";

  return (
    <div className="grid grid-cols-[1fr_120px_1fr] items-center py-2.5 border-b border-border last:border-0 gap-2">
      {/* Value A */}
      <div className="text-right">
        <span className={`text-base font-bold transition-colors ${winA ? "text-green" : "text-primary"}`}>
          {valA}{unit}
        </span>
        {winA && <span className="ml-1 text-2xs text-green font-black">▲</span>}
      </div>
      {/* Label */}
      <p className="text-center text-xs text-muted font-medium">{label}</p>
      {/* Value B */}
      <div className="text-left">
        {winB && <span className="mr-1 text-2xs text-purple font-black">▲</span>}
        <span className={`text-base font-bold transition-colors ${winB ? "text-purple" : "text-primary"}`}>
          {valB}{unit}
        </span>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ────────────────────────────────── */
export default function ComparePage() {
  const { compareList } = useScoutStore();

  // Slots: start with players from the store if any
  const [slotA, setSlotA] = useState<SearchHit | null>(compareList[0] ?? null);
  const [slotB, setSlotB] = useState<SearchHit | null>(compareList[1] ?? null);
  const [dataA, setDataA] = useState<any | null>(null);
  const [dataB, setDataB] = useState<any | null>(null);
  const [loadA, setLoadA] = useState(false);
  const [loadB, setLoadB] = useState(false);

  const fetchPlayer = useCallback(async (id: number, setter: typeof setDataA, loadSetter: typeof setLoadA) => {
    loadSetter(true);
    try {
      const { data } = await api.get(`/players/${id}`);
      setter(data);
    } catch { setter(null); }
    finally { loadSetter(false); }
  }, []);

  useEffect(() => {
    if (slotA) fetchPlayer(slotA.id, setDataA, setLoadA);
    else setDataA(null);
  }, [slotA, fetchPlayer]);

  useEffect(() => {
    if (slotB) fetchPlayer(slotB.id, setDataB, setLoadB);
    else setDataB(null);
  }, [slotB, fetchPlayer]);

  const statA = dataA?.stats?.sort((a: any, b: any) => b.season?.year - a.season?.year)[0] ?? {};
  const statB = dataB?.stats?.sort((a: any, b: any) => b.season?.year - a.season?.year)[0] ?? {};

  const n = (v: string | number | null | undefined) => {
    const f = parseFloat(String(v ?? "0"));
    return isNaN(f) ? 0 : f;
  };

  const bothLoaded = slotA && slotB && dataA && dataB && !loadA && !loadB;

  // Radar
  const radarData = bothLoaded ? [
    { metric: "Goles", playerA: Math.min(100, n(statA.goals) * 5), playerB: Math.min(100, n(statB.goals) * 5) },
    { metric: "Asist.", playerA: Math.min(100, n(statA.assists) * 6), playerB: Math.min(100, n(statB.assists) * 6) },
    { metric: "xG", playerA: Math.min(100, n(statA.xgPerGame) * 150), playerB: Math.min(100, n(statB.xgPerGame) * 150) },
    { metric: "Pases%", playerA: Math.min(100, n(statA.passAccuracyPct)), playerB: Math.min(100, n(statB.passAccuracyPct)) },
    { metric: "Tackles", playerA: Math.min(100, n(statA.tackles) * 0.8), playerB: Math.min(100, n(statB.tackles) * 0.8) },
    { metric: "Recup.", playerA: Math.min(100, n(statA.recoveries)), playerB: Math.min(100, n(statB.recoveries)) },
    { metric: "Regates%", playerA: Math.min(100, n(statA.dribbleSuccessRate)), playerB: Math.min(100, n(statB.dribbleSuccessRate)) },
    { metric: "Aéreos%", playerA: Math.min(100, n(statA.aerialDuelsWonPct)), playerB: Math.min(100, n(statB.aerialDuelsWonPct)) },
  ] : [];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-primary">Player Comparison</h1>
          <p className="text-sm text-muted mt-0.5">Temporada 2026 · Liga Profesional</p>
        </div>
        {(slotA || slotB) && (
          <button onClick={() => { setSlotA(null); setSlotB(null); }}
            className="btn btn-ghost text-sm gap-1.5 text-danger hover:border-danger/30">
            <RotateCcw size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* ── 2 Slots ── */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerSlot
          player={slotA}
          fullData={dataA}
          loading={loadA}
          color="green"
          slotLabel="Seleccioná el primer jugador"
          onSelect={(p) => setSlotA(p)}
          onClear={() => setSlotA(null)}
        />
        <PlayerSlot
          player={slotB}
          fullData={dataB}
          loading={loadB}
          color="purple"
          slotLabel="Seleccioná el segundo jugador"
          onSelect={(p) => setSlotB(p)}
          onClear={() => setSlotB(null)}
        />
      </div>

      {/* ── Comparison content (only when both selected) ── */}
      {bothLoaded && (
        <div className="space-y-4 animate-fade-in">

          {/* Legend */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green" />
              <span className="text-sm text-secondary">{dataA.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple" />
              <span className="text-sm text-secondary">{dataB.name}</span>
            </div>
          </div>

          {/* Radar chart */}
          <div className="card">
            <p className="section-title mb-2">Radar de rendimiento</p>
            <RadarChartComponent
              data={radarData}
              nameA={dataA.name}
              nameB={dataB.name}
              colorA="#00E094"
              colorB="#7533FC"
            />
          </div>

          {/* Stats comparison table */}
          <div className="card">
            <div className="grid grid-cols-[1fr_120px_1fr] items-center mb-3 pb-3 border-b border-border">
              <p className="text-right text-sm font-black text-green truncate pr-2">{dataA.name.split(" ")[0]}</p>
              <p className="text-center text-2xs text-muted uppercase tracking-wider font-semibold">Métrica</p>
              <p className="text-left text-sm font-black text-purple truncate pl-2">{dataB.name.split(" ")[0]}</p>
            </div>

            {/* Ataque */}
            <p className="text-2xs text-muted uppercase tracking-wider font-semibold mb-1">Ataque</p>
            <CompRow label="Goles" valA={fmtVal(statA.goals)} valB={fmtVal(statB.goals)} numA={n(statA.goals)} numB={n(statB.goals)} />
            <CompRow label="Asistencias" valA={fmtVal(statA.assists)} valB={fmtVal(statB.assists)} numA={n(statA.assists)} numB={n(statB.assists)} />
            <CompRow label="xG/PJ" valA={fmtVal(statA.xgPerGame, 2)} valB={fmtVal(statB.xgPerGame, 2)} numA={n(statA.xgPerGame)} numB={n(statB.xgPerGame)} />
            <CompRow label="Tiros/PJ" valA={fmtVal(statA.shotsPerGame, 2)} valB={fmtVal(statB.shotsPerGame, 2)} numA={n(statA.shotsPerGame)} numB={n(statB.shotsPerGame)} />
            <CompRow label="Tiros al arco%" valA={`${fmtVal(statA.shotsOnTargetPct, 1)}%`} valB={`${fmtVal(statB.shotsOnTargetPct, 1)}%`} numA={n(statA.shotsOnTargetPct)} numB={n(statB.shotsOnTargetPct)} />

            {/* Pases */}
            <p className="text-2xs text-muted uppercase tracking-wider font-semibold mt-3 mb-1">Pases</p>
            <CompRow label="xA/PJ" valA={fmtVal(statA.xaPerGame, 2)} valB={fmtVal(statB.xaPerGame, 2)} numA={n(statA.xaPerGame)} numB={n(statB.xaPerGame)} />
            <CompRow label="Pases clave/PJ" valA={fmtVal(statA.keyPassesPerGame, 2)} valB={fmtVal(statB.keyPassesPerGame, 2)} numA={n(statA.keyPassesPerGame)} numB={n(statB.keyPassesPerGame)} />
            <CompRow label="Precisión pases%" valA={`${fmtVal(statA.passAccuracyPct, 1)}%`} valB={`${fmtVal(statB.passAccuracyPct, 1)}%`} numA={n(statA.passAccuracyPct)} numB={n(statB.passAccuracyPct)} />

            {/* Defensa */}
            <p className="text-2xs text-muted uppercase tracking-wider font-semibold mt-3 mb-1">Defensa</p>
            <CompRow label="Tackles" valA={fmtVal(statA.tackles)} valB={fmtVal(statB.tackles)} numA={n(statA.tackles)} numB={n(statB.tackles)} />
            <CompRow label="Intercepciones" valA={fmtVal(statA.interceptions)} valB={fmtVal(statB.interceptions)} numA={n(statA.interceptions)} numB={n(statB.interceptions)} />
            <CompRow label="Recuperaciones" valA={fmtVal(statA.recoveries)} valB={fmtVal(statB.recoveries)} numA={n(statA.recoveries)} numB={n(statB.recoveries)} />
            <CompRow label="Duelos aéreos%" valA={`${fmtVal(statA.aerialDuelsWonPct, 1)}%`} valB={`${fmtVal(statB.aerialDuelsWonPct, 1)}%`} numA={n(statA.aerialDuelsWonPct)} numB={n(statB.aerialDuelsWonPct)} />

            {/* Regates */}
            <p className="text-2xs text-muted uppercase tracking-wider font-semibold mt-3 mb-1">Regates</p>
            <CompRow label="Regates exitosos/PJ" valA={fmtVal(statA.successfulDribblesPerGame, 2)} valB={fmtVal(statB.successfulDribblesPerGame, 2)} numA={n(statA.successfulDribblesPerGame)} numB={n(statB.successfulDribblesPerGame)} />
            <CompRow label="Tasa de éxito %" valA={`${fmtVal(statA.dribbleSuccessRate, 1)}%`} valB={`${fmtVal(statB.dribbleSuccessRate, 1)}%`} numA={n(statA.dribbleSuccessRate)} numB={n(statB.dribbleSuccessRate)} />

            {/* Disciplina */}
            <p className="text-2xs text-muted uppercase tracking-wider font-semibold mt-3 mb-1">Disciplina</p>
            <CompRow label="Tarjetas amarillas" valA={fmtVal(statA.yellowCards)} valB={fmtVal(statB.yellowCards)} numA={n(statA.yellowCards)} numB={n(statB.yellowCards)} higherIsBetter={false} />
            <CompRow label="Tarjetas rojas" valA={fmtVal(statA.redCards)} valB={fmtVal(statB.redCards)} numA={n(statA.redCards)} numB={n(statB.redCards)} higherIsBetter={false} />
          </div>

          {/* PJ block */}
          <div className="card">
            <p className="section-title mb-4">Participación</p>
            <CompRow label="Partidos jugados" valA={fmtVal(statA.matchesPlayed)} valB={fmtVal(statB.matchesPlayed)} numA={n(statA.matchesPlayed)} numB={n(statB.matchesPlayed)} />
            <CompRow label="Minutos jugados" valA={fmtVal(statA.minutesPlayed)} valB={fmtVal(statB.minutesPlayed)} numA={n(statA.minutesPlayed)} numB={n(statB.minutesPlayed)} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!slotA && !slotB && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 rounded-lg bg-card-2 border border-border flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted">
              <path d="M9 19H5a2 2 0 01-2-2V7a2 2 0 012-2h4M15 19h4a2 2 0 002-2V7a2 2 0 00-2-2h-4M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-primary font-semibold">Compará dos jugadores</p>
          <p className="text-sm text-secondary max-w-xs">
            Buscá directamente en los slots de arriba, o marcá jugadores con el botón
            <strong className="text-primary"> Comparar</strong> desde su perfil.
          </p>
        </div>
      )}
    </div>
  );
}
