"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Star, BarChart2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Select, SelectItem } from "@nextui-org/react";
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
        <span className="absolute inset-0 flex items-center justify-center text-base font-black text-primary">
          {pct.toFixed(0)}%
        </span>
      </div>
      <span className="text-2xs text-secondary text-center font-bold leading-tight max-w-[64px]">{label}</span>
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
    <div className="flex items-center gap-3 py-[7px] border-b border-border/40 last:border-0">
      <span className="text-base text-secondary font-medium flex-1 min-w-0">{label}</span>
      <span className="text-base font-black text-primary w-[56px] text-right flex-shrink-0">{display}</span>
      <div className="w-[160px] flex-shrink-0 h-[5px] rounded-full bg-input">
        <div className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(255,255,255,0.05)]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Section Divider ─────────────────────── */
function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1 mt-5 first:mt-0">
        <span className="text-xs font-black uppercase tracking-widest text-green">{title}</span>
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
    <div className="card shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-6">
        <p className="section-title mb-0">Estadísticas completas</p>
        <span className="text-2xs text-secondary font-black bg-white/5 border border-white/10 px-2.5 py-1 rounded-md uppercase tracking-widest">{player.position}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">

        {/* GK Specific Section */}
        {isGK && (
          <StatSection title="Portería">
            <StatBarRow label="Efectividad en paradas" value={stat.savePct} maxValue={100} color="#E8A838" isPercent />
            <StatBarRow label="Vallas invictas" value={stat.cleanSheets} maxValue={20} color="#00E094" />
            <StatBarRow label="Goles recibidos" value={stat.goalsConceded} maxValue={50} color="#F04444" />
          </StatSection>
        )}

        {/* Attack Section */}
        {(isATT || !isGK) && (
          <StatSection title="Ataque">
            <StatBarRow label="Goles" value={stat.goals} maxValue={30} color="#00E094" />
            <StatBarRow label="xG por partido" value={stat.xgPerGame} maxValue={1.5} color="#00E094" />
            <StatBarRow label="Tiros por partido" value={stat.shotsPerGame} maxValue={6} color="#0C65D4" />
            <StatBarRow label="Tiros al arco %" value={stat.shotsOnTargetPct} maxValue={100} color="#0C65D4" isPercent />
          </StatSection>
        )}

        {/* Passing / Creation Section */}
        <StatSection title="Pases y Creación">
          <StatBarRow label="Asistencias" value={stat.assists} maxValue={20} color="#00E094" />
          <StatBarRow label="xA por partido" value={stat.xaPerGame} maxValue={1} color="#00E094" />
          <StatBarRow label="Pases clave por partido" value={stat.keyPassesPerGame} maxValue={3} color="#00E094" />
          <StatBarRow label="Precisión de pases %" value={stat.passAccuracyPct} maxValue={100} color="#0C65D4" isPercent />
        </StatSection>

        {/* Defense Section */}
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
        className="inline-flex items-center gap-1.5 text-md text-muted hover:text-secondary transition-colors">
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
              <span className="absolute -bottom-1 -right-1 badge badge-muted text-2xs">
                {player.nationality.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + chips + actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge text-2xs ${posStyle(player.position)}`}>{player.position}</span>
                  {age && <span className="text-base text-muted">{age} años</span>}
                  {player.preferredFoot && <span className="text-base text-muted">· {player.preferredFoot}</span>}
                  {player.heightCm && <span className="text-base text-muted">· {player.heightCm} cm</span>}
                </div>
                <h1 className="text-2xl font-black text-primary leading-tight">{player.name}</h1>
                {player.team?.name && (
                  <div className="flex items-center gap-2 mt-1">
                    {player.team.logoUrl && <Image src={player.team.logoUrl} alt="" width={15} height={15} unoptimized />}
                    <span className="text-base text-secondary">{player.team.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Season selector */}
                {allStats.length > 1 && (
                  <Select
                    selectedKeys={selSeasonId ? [String(selSeasonId)] : []}
                    onChange={(e) => { 
                      if (e.target.value) setSelSeason(Number(e.target.value));
                    }}
                    aria-label="Seleccionar Temporada"
                    className="w-52"
                    variant="flat"
                    scrollShadowProps={{ isEnabled: false }}
                    classNames={{
                      trigger: "bg-input/60 border border-border rounded-lg px-3 h-9 min-h-[36px] data-[hover=true]:bg-input/80 transition-all",
                      value: "text-base font-bold text-primary",
                      popoverContent: "bg-card border border-border min-w-[200px]"
                    }}
                    startContent={
                      <span className="text-2xs font-black text-muted uppercase tracking-widest mr-2 shrink-0">Temporada</span>
                    }
                  >
                    {allStats.map((s: any) => (
                      <SelectItem 
                        key={String(s.seasonId)} 
                        textValue={s.season?.name || String(s.seasonId)}
                        classNames={{
                          base: "data-[hover=true]:bg-white/5",
                          title: "text-base font-bold"
                        }}
                      >
                        {s.season?.name || s.seasonId}
                      </SelectItem>
                    ))}
                  </Select>
                )}

                <button
                  onClick={() => fav ? removeFavorite(player.id) : addFavorite(player)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${fav ? "bg-gold/10 border-gold/30 text-gold" : "bg-input border-border text-muted hover:text-gold hover:border-gold/30"}`}
                >
                  <Star size={15} fill={fav ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => compare ? removeFromCompare(player.id) : addToCompare(player)}
                  className={`btn text-mainBg h-9 px-3 ${compare ? "bg-purple/15 text-purple border border-purple/35" : "btn-primary"}`}
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
                    <p className={`text-xl font-black leading-none ${ratingColor}`}>{mainRating.toFixed(1)}</p>
                    <p className="text-2xs text-muted mt-0.5 uppercase tracking-wide">Rating</p>
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
                    <p className="text-md font-bold text-primary leading-none">{value}</p>
                    <p className="text-2xs text-muted mt-0.5 uppercase tracking-wide">{label}</p>
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
                <span className="text-base text-muted">{label}</span>
                <span className="text-base font-semibold text-primary">{value}</span>
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
          <p className="text-base text-muted py-6 text-center">Sin lesiones registradas</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
            {player.injuries.slice(0, 8).map((inj: any) => (
              <div key={inj.id} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${inj.daysOut > 60 ? "bg-danger" : inj.daysOut > 20 ? "bg-warn" : "bg-green"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-base text-primary leading-tight truncate">{inj.injuryType}</p>
                  <p className="text-2xs text-muted">{inj.daysOut} días · {inj.startedAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
