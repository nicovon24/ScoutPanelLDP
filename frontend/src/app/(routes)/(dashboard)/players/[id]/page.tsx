"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Star, BarChart2, AlertTriangle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import RadarChartComponent from "@/components/charts/RadarChart";
import LineChartComponent from "@/components/charts/LineChart";

/* ── Helpers ─────────────────────────────── */
function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}
function posStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}
function fmt(v: string | number | undefined | null, decimals = 0) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return decimals > 0 ? n.toFixed(decimals) : String(n);
}
function fmtPct(v: string | number | undefined | null) {
  const s = fmt(v, 1);
  return s === "—" ? "—" : `${s}%`;
}

/* ── Donut Circle ────────────────────────── */
function DonutCircle({ value, label, color = "#00E094" }: { value: number; label: string; color?: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[64px] h-[64px]">
        <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
          <circle cx="34" cy="34" r={r} fill="none" stroke="#2C2C2C" strokeWidth="5" />
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-primary">
          {pct.toFixed(0)}%
        </span>
      </div>
      <span className="text-[10px] text-secondary text-center leading-tight max-w-[64px]">{label}</span>
    </div>
  );
}

/* ── Stat Bar Row (SofaScore style) ─────── */
function StatBarRow({
  label, value, maxValue = 100, color = "#00E094", isPercent = false
}: {
  label: string;
  value: string | number | null | undefined;
  maxValue?: number;
  color?: string;
  isPercent?: boolean;
}) {
  const raw = value == null || value === "" ? null : parseFloat(String(value));
  const pct = raw == null || isNaN(raw) ? 0 : Math.min(100, (raw / maxValue) * 100);
  const display = raw == null || isNaN(raw) ? "—" : isPercent ? `${raw.toFixed(1)}%` : fmt(raw, String(value).includes(".") ? 2 : 0);

  return (
    <div className="flex items-center gap-3 py-[7px] border-b border-border/60 last:border-0">
      <span className="text-[12px] text-secondary flex-1 min-w-0">{label}</span>
      <span className="text-[12px] font-bold text-primary w-[56px] text-right flex-shrink-0">{display}</span>
      <div className="w-[160px] flex-shrink-0 h-[5px] rounded-full bg-[#1E1E1E]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Section Divider ─────────────────────── */
function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1 mt-5 first:mt-0">
        <span className="text-[11px] font-black uppercase tracking-widest text-green">{title}</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>
      {children}
    </div>
  );
}

/* ── All Stats Panel ─────────────────────── */
function AllStatsPanel({ player, stat }: { player: any; stat: any }) {
  const pos = player.position?.toUpperCase();
  const isGK = pos === "GK";
  const isDEF = ["CB", "LB", "RB"].includes(pos);
  const isMID = ["CAM", "CM", "CDM"].includes(pos);
  const isATT = ["CF", "SS", "LW", "RW"].includes(pos);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title mb-0">Estadísticas completas</p>
        <span className="text-[10px] text-muted font-medium bg-input px-2 py-0.5 rounded uppercase">{player.position}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">

        {/* GK Specific Section */}
        {isGK && (
          <StatSection title="Portería">
            <StatBarRow label="Efectividad en paradas" value={stat.savePct} maxValue={100} color="#E8A838" isPercent />
            <StatBarRow label="Vallas invictas" value={stat.cleanSheets} maxValue={20} color="#00E094" />
            <StatBarRow label="Goles recibidos" value={stat.goalsConceded} maxValue={50} color="#F04444" />
          </StatSection>
        )}

        {/* Attack Section - Primary for Attackers, shown for others too if relevant */}
        {(isATT || !isGK) && (
          <StatSection title="Ataque">
            <StatBarRow label="Goles" value={stat.goals} maxValue={30} color="#00E094" />
            <StatBarRow label="xG por partido" value={stat.xgPerGame} maxValue={1.5} color="#00E094" />
            <StatBarRow label="Tiros por partido" value={stat.shotsPerGame} maxValue={6} color="#0C65D4" />
            <StatBarRow label="Tiros al arco %" value={stat.shotsOnTargetPct} maxValue={100} color="#0C65D4" isPercent />
          </StatSection>
        )}

        {/* Passing / Creation Section - Primary for Midfielders */}
        <StatSection title="Pases y Creación">
          <StatBarRow label="Asistencias" value={stat.assists} maxValue={20} color="#00E094" />
          <StatBarRow label="xA por partido" value={stat.xaPerGame} maxValue={1} color="#00E094" />
          <StatBarRow label="Pases clave por partido" value={stat.keyPassesPerGame} maxValue={3} color="#00E094" />
          <StatBarRow label="Precisión de pases %" value={stat.passAccuracyPct} maxValue={100} color="#0C65D4" isPercent />
        </StatSection>

        {/* Defense Section - Primary for Defenders and CDMs */}
        <StatSection title="Defensa">
          <StatBarRow label="Tackles" value={stat.tackles} maxValue={80} color="#00E094" />
          <StatBarRow label="Intercepciones" value={stat.interceptions} maxValue={50} color="#00E094" />
          <StatBarRow label="Recuperaciones" value={stat.recoveries} maxValue={80} color="#0C65D4" />
          <StatBarRow label="Duelos aéreos ganados %" value={stat.aerialDuelsWonPct} maxValue={100} color="#7533FC" isPercent />
        </StatSection>

        {/* Possession Section */}
        {!isGK && (
          <StatSection title="Posesión y Regate">
            <StatBarRow label="Regates exitosos / PJ" value={stat.successfulDribblesPerGame} maxValue={5} color="#00E094" />
            <StatBarRow label="Tasa de regates %" value={stat.dribbleSuccessRate} maxValue={100} color="#0C65D4" isPercent />
          </StatSection>
        )}

        {/* Discipline Section */}
        <StatSection title="Disciplina">
          <StatBarRow label="Tarjetas amarillas" value={stat.yellowCards} maxValue={15} color="#E8A838" />
          <StatBarRow label="Tarjetas rojas" value={stat.redCards} maxValue={5} color="#F04444" />
        </StatSection>

      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */
export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selSeasonId, setSelSeason] = useState<number | null>(null);

  const { isFavorite, addFavorite, removeFavorite, addToCompare, isInCompare, removeFromCompare } = useScoutStore();

  useEffect(() => {
    api.get(`/players/${id}`)
      .then(({ data }) => {
        setPlayer(data);
        if (data.stats?.length) {
          const sorted = [...data.stats].sort((a: any, b: any) => b.season?.year - a.season?.year);
          setSelSeason(sorted[0]?.seasonId ?? null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-green" />
    </div>
  );
  if (!player) return <p className="text-center text-muted py-32">Jugador no encontrado.</p>;

  const fav = isFavorite(player.id);
  const compare = isInCompare(player.id);
  const age = calcAge(player.dateOfBirth);

  const allStats = [...(player.stats ?? [])].sort((a: any, b: any) => b.season?.year - a.season?.year);
  const curStat = allStats.find((s: any) => s.seasonId === selSeasonId) ?? allStats[0];
  const curRating = player.ratings?.find((r: any) => r.seasonId === selSeasonId) ?? player.ratings?.[0];

  const ratingHistory = curRating?.ratingByMonth
    ? Object.entries(curRating.ratingByMonth as Record<string, number>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, rval]) => ({ month: month.slice(5), rating: rval }))
    : [];

  const radarData = curStat ? [
    { metric: "Goles", playerA: Math.min(100, (curStat.goals ?? 0) * 5) },
    { metric: "Asist.", playerA: Math.min(100, (curStat.assists ?? 0) * 6) },
    { metric: "xG", playerA: Math.min(100, parseFloat(curStat.xgPerGame ?? "0") * 150) },
    { metric: "Pases%", playerA: Math.min(100, parseFloat(curStat.passAccuracyPct ?? "0")) },
    { metric: "Tackles", playerA: Math.min(100, (curStat.tackles ?? 0) * 0.8) },
    { metric: "Recup.", playerA: Math.min(100, (curStat.recoveries ?? 0) * 1.0) },
    { metric: "Regates%", playerA: Math.min(100, parseFloat(curStat.dribbleSuccessRate ?? "0")) },
    { metric: "Aéreos%", playerA: Math.min(100, parseFloat(curStat.aerialDuelsWonPct ?? "0")) },
  ] : [];

  const mainRating = curStat ? parseFloat(curStat.sofascoreRating ?? "0") : null;
  const ratingColor = mainRating
    ? mainRating >= 7.5 ? "text-green" : mainRating >= 7.0 ? "text-gold" : "text-secondary"
    : "text-muted";



  /* Quick Info chips */
  const infoChips = [
    { label: "Posición", value: player.position },
    { label: "Pie hábil", value: player.preferredFoot ?? "—" },
    { label: "Altura", value: player.heightCm ? `${player.heightCm} cm` : "—" },
    { label: "Peso", value: player.weightKg ? `${player.weightKg} kg` : "—" },
    { label: "Nac.", value: player.nationality ?? "—" },
    { label: "Debut", value: player.debutYear ?? "—" },
    { label: "Club", value: player.team?.name ?? "—" },
    { label: "Valor", value: `€${parseFloat(player.marketValueM ?? "0").toFixed(1)}M` },
  ];

  return (
    /* 
      Wrapper: no max-width restriction so it fills the parent (max-w-[1400px] from dashboard layout)
      All cards share the same full width.
    */
    <div className="space-y-4 animate-fade-in pb-10">

      {/* Back */}
      <Link href="/"
        className="inline-flex items-center gap-1.5 text-[16px] text-muted hover:text-secondary transition-colors">
        <ArrowLeft size={13} />
        Todos los jugadores
      </Link>

      {/* ══════════════════════════════════════════════════════════════
          HERO — full width
      ══════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex gap-5 items-start">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-[100px] h-[100px] rounded-xl bg-input border border-border overflow-hidden flex items-center justify-center text-4xl font-black text-muted">
              {player.photoUrl
                ? <Image src={player.photoUrl} alt={player.name} width={100} height={100} className="object-cover w-full h-full" unoptimized />
                : player.name[0]}
            </div>
            {player.nationality && (
              <span className="absolute -bottom-1 -right-1 badge badge-muted text-[9px]">
                {player.nationality.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + chips + actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge text-[10px] ${posStyle(player.position)}`}>{player.position}</span>
                  {age && <span className="text-[13px] text-muted">{age} años</span>}
                  {player.preferredFoot && <span className="text-[13px] text-muted">· {player.preferredFoot}</span>}
                  {player.heightCm && <span className="text-[13px] text-muted">· {player.heightCm} cm</span>}
                </div>
                <h1 className="text-[24px] font-black text-primary leading-tight">{player.name}</h1>
                {player.team?.name && (
                  <div className="flex items-center gap-2 mt-1">
                    {player.team.logoUrl && <Image src={player.team.logoUrl} alt="" width={15} height={15} unoptimized />}
                    <span className="text-[13px] text-secondary">{player.team.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Season selector */}
                {allStats.length > 1 && (
                  <div className="flex items-center gap-2 bg-input/60 border border-border rounded-lg pl-3 pr-1 h-9">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Temporada</span>
                    <select
                      value={selSeasonId ?? ""}
                      onChange={(e) => setSelSeason(Number(e.target.value))}
                      className="bg-transparent text-[12px] font-bold text-primary outline-none cursor-pointer pr-6 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right center"
                      }}
                    >
                      {allStats.map((s: any) => (
                        <option key={s.seasonId} value={s.seasonId} className="bg-card">
                          {s.season?.name ?? s.seasonId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => fav ? removeFavorite(player.id) : addFavorite(player)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${fav ? "bg-gold/10 border-gold/30 text-gold" : "bg-input border-border text-muted hover:text-gold hover:border-gold/30"}`}
                >
                  <Star size={15} fill={fav ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => compare ? removeFromCompare(player.id) : addToCompare(player)}
                  className={`btn text-[12px] h-9 px-3 ${compare ? "bg-purple/15 text-purple border border-purple/35" : "btn-primary"}`}
                >
                  <BarChart2 size={13} />
                  {compare ? "En comparación" : "Comparar"}
                </button>
              </div>
            </div>

            {/* Quick stats bar */}
            {curStat && (
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border flex-wrap">
                {mainRating != null && mainRating > 0 && (
                  <div className="text-center">
                    <p className={`text-[20px] font-black leading-none ${ratingColor}`}>{mainRating.toFixed(1)}</p>
                    <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">Rating</p>
                  </div>
                )}
                {[
                  { label: "PJ", value: curStat.matchesPlayed },
                  { label: "Min", value: curStat.minutesPlayed ? `${curStat.minutesPlayed}'` : "—" },
                  { label: "Goles", value: curStat.goals },
                  { label: "Asist", value: curStat.assists },
                  { label: "xG", value: fmt(curStat.xgPerGame, 2) },
                  { label: "xA", value: fmt(curStat.xaPerGame, 2) },
                  { label: "Valor", value: `€${parseFloat(player.marketValueM ?? "0").toFixed(1)}M` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-[15px] font-bold text-primary leading-none">{value}</p>
                    <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 2: Info chips (2-col grid) + Donuts (4 circles)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">

        {/* Player info table — compact horizontal grid */}
        <div className="card">
          <p className="section-title">Información del jugador</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-0">
            {infoChips.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-[12px] text-muted">{label}</span>
                <span className="text-[12px] font-semibold text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 donuts */}
        {curStat && (
          <div className="card flex-shrink-0">
            <p className="section-title">Eficiencia</p>
            <div className="grid grid-cols-4 gap-4">
              <DonutCircle value={parseFloat(curStat.shotsOnTargetPct ?? "0")} label="Tiros al arco" color="#00E094" />
              <DonutCircle value={Math.min(100, (curStat.goals ?? 0) / Math.max(1, curStat.matchesPlayed ?? 1) * 100 * 4)} label="Conversión gol" color="#0C65D4" />
              <DonutCircle value={parseFloat(curStat.dribbleSuccessRate ?? "0")} label="Regates" color="#7533FC" />
              <DonutCircle value={parseFloat(curStat.aerialDuelsWonPct ?? "0")} label="Duelos aéreos" color="#E8A838" />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 3: Radar + Rating evolution (side by side)
      ══════════════════════════════════════════════════════════════ */}
      {(radarData.length > 0 || ratingHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {radarData.length > 0 && (
            <div className="card">
              <p className="section-title">Radar de rendimiento</p>
              <RadarChartComponent data={radarData} nameA={player.name} colorA="#00E094" />
            </div>
          )}
          {ratingHistory.length > 0 && (
            <div className="card">
              <p className="section-title">Evolución del rating</p>
              <LineChartComponent data={ratingHistory} nameA={player.name} />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ROW 4: ALL STATS  —  full width, all sections together
      ══════════════════════════════════════════════════════════════ */}
      {curStat && <AllStatsPanel player={player} stat={curStat} />}

      {/* ══════════════════════════════════════════════════════════════
          ROW 5: Injuries — full width
      ══════════════════════════════════════════════════════════════ */}
      <div className="card">
        <p className="section-title flex items-center gap-1">
          <AlertTriangle size={11} className="text-warn" />
          Lesiones
        </p>
        {!player.injuries?.length ? (
          <p className="text-[12px] text-muted py-6 text-center">Sin lesiones registradas</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
            {player.injuries.slice(0, 8).map((inj: any) => (
              <div key={inj.id} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${inj.daysOut > 60 ? "bg-danger" : inj.daysOut > 20 ? "bg-warn" : "bg-green"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-primary leading-tight truncate">{inj.injuryType}</p>
                  <p className="text-[10px] text-muted">{inj.daysOut} días · {inj.startedAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
