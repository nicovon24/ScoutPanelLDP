"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star, BarChart2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Select, SelectItem } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import { useShortlist } from "@/hooks/useShortlist";
import RadarChartComponent from "@/components/charts/RadarChart";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";
import EvolutionBarChart from "@/components/charts/EvolutionBarChart";
import MarketValueChart from "@/components/charts/MarketValueChart";
import HeatmapField from "@/components/player/HeatmapField";
import PlayerStatsTable from "@/components/player/PlayerStatsTable";

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

function contractTypeLabel(t?: string | null) {
  if (t === "LOAN") return "Préstamo";
  if (t === "FREE") return "Libre";
  if (t === "PERMANENT") return "Definitivo";
  return t ?? "—";
}

function careerYearKey(yearRange: string): number {
  const m = yearRange.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}


/* ── Donut Circle ────────────────────────── */
function DonutCircle({ value, label, color = "#00E094" }: { value: number; label: string; color?: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[100px] h-[100px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease-out" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-primary">
          {pct.toFixed(0)}%
        </span>
      </div>
      <span className="text-2xs text-secondary text-center font-bold uppercase tracking-widest leading-tight max-w-[90px]">{label}</span>
    </div>
  );
}


/* ── Main Page ───────────────────────────── */
export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selSeasonId, setSelSeason] = useState<number | null>(null);
  const [ratingMode, setRatingMode] = useState<"year" | "month">("month");
  const [valueMode, setValueMode] = useState<"year" | "month">("month");

  const { addToCompare, isInCompare, removeFromCompare } = useScoutStore();
  const { isFavorite, addFavorite, removeFavorite } = useShortlist();

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

  const ratingHistory = (() => {
    const monthlyRaw: Map<string, number> = new Map();
    const monthlyRatingSource = selSeasonId
      ? (player.ratings ?? []).filter((r: any) => r.seasonId === selSeasonId)
      : (player.ratings ?? []);
    monthlyRatingSource.forEach((r: any) => {
      if (r.ratingByMonth) Object.entries(r.ratingByMonth as Record<string, number>).forEach(([m, v]) => monthlyRaw.set(m, v));
    });

    if (ratingMode === "year") {
      const yearlyMap: Record<string, { sum: number; count: number; injured: boolean }> = {};
      (player.ratings ?? []).forEach((r: any) => {
        if (r.ratingByMonth) {
          Object.entries(r.ratingByMonth as Record<string, number>).forEach(([month, val]) => {
            const y = month.split("-")[0];
            if (!yearlyMap[y]) yearlyMap[y] = { sum: 0, count: 0, injured: false };
            yearlyMap[y].sum += val; yearlyMap[y].count++;
            const isInjured = player.injuries?.some((inj: any) => {
              const start = new Date(inj.startedAt);
              const end = new Date(start);
              end.setDate(start.getDate() + (inj.daysOut || 0));
              const current = new Date(parseInt(y), parseInt(month.split("-")[1]) - 1, 15);
              return current >= start && current <= end;
            });
            if (isInjured) yearlyMap[y].injured = true;
          });
        }
      });
      return Object.entries(yearlyMap).sort(([a], [b]) => a.localeCompare(b)).map(([y, d]) => ({ month: y, rating: d.sum / d.count, injured: d.injured }));
    } else {
      let targetYear = 2026;
      if (selSeasonId) {
        const s = player.stats?.find((st: any) => st.seasonId === selSeasonId);
        if (s?.season?.year) targetYear = s.season.year;
      }
      const res = [];
      const suf = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      for (let m = 0; m < 12; m++) {
        const key = `${targetYear}-${(m + 1).toString().padStart(2, '0')}`;
        const isInjured = player.injuries?.some((inj: any) => {
          const start = new Date(inj.startedAt);
          const end = new Date(start);
          end.setDate(start.getDate() + (inj.daysOut || 0));
          const current = new Date(targetYear as number, m, 15);
          return current >= start && current <= end;
        });
        res.push({ month: suf[m], year: targetYear.toString(), rating: monthlyRaw.get(key) ?? 0, injured: isInjured });
      }
      return res;
    }
  })();

  const valueHistory = (() => {
    if (valueMode === "year") {
      const allYears = Array.from(new Set([
        ... (player.stats ?? []).map((s: any) => s.season?.year?.toString()),
        ... (player.ratings ?? []).flatMap((r: any) => Object.keys(r.ratingByMonth || {}).map(m => m.split("-")[0]))
      ])).filter(Boolean).sort();
      let lastVal = parseFloat(player.marketValueM ?? "0");
      return allYears.map(y => {
        const s = player.stats?.find((st: any) => st.season?.year?.toString() === y);
        if (s?.marketValueM) lastVal = parseFloat(s.marketValueM);
        return { month: y, value: lastVal };
      });
    } else {
      let targetYear = 2026, targetVal = parseFloat(player.marketValueM ?? "0");
      if (selSeasonId) {
        const s = player.stats?.find((st: any) => st.seasonId === selSeasonId);
        if (s?.season?.year) targetYear = s.season.year;
        if (s?.marketValueM) targetVal = parseFloat(s.marketValueM);
      }
      const suf = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const today = new Date();
      return suf.map((m, i) => ({
        month: m,
        year: targetYear.toString(),
        value: targetVal + (Math.sin(i) * 0.05 * targetVal),
        future: new Date(targetYear as number, i, 1) > today,
      }));
    }
  })();


  const n = (v: any) => { const f = parseFloat(String(v ?? "0")); return isNaN(f) ? 0 : f; };
  const radarData = curStat ? [
    { metric: "Goles",       playerA: Math.min(100, n(curStat.goals) * 5) },
    { metric: "xG/PJ",       playerA: Math.min(100, n(curStat.xgPerGame) * 100) },
    { metric: "Asistencias", playerA: Math.min(100, n(curStat.assists) * 8) },
    { metric: "xA/PJ",       playerA: Math.min(100, n(curStat.xaPerGame) * 100) },
    { metric: "Pases clave", playerA: Math.min(100, n(curStat.keyPassesPerGame) * 35) },
    { metric: "Pases%",      playerA: Math.min(100, n(curStat.passAccuracyPct)) },
    { metric: "Regates%",    playerA: Math.min(100, n(curStat.dribbleSuccessRate)) },
    { metric: "Tackles",     playerA: Math.min(100, n(curStat.tackles) * 1.5) },
    { metric: "Intercep.",   playerA: Math.min(100, n(curStat.interceptions) * 2) },
    { metric: "Recuper.",    playerA: Math.min(100, n(curStat.recoveries) * 0.8) },
    { metric: "Aéreos%",     playerA: Math.min(100, n(curStat.aerialDuelsWonPct)) },
    { metric: "Rating",      playerA: Math.min(100, n(curStat.sofascoreRating) * 11) },
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
    { label: "Tipo contrato", value: contractTypeLabel(player.contractType) },
    { label: "Contrato hasta", value: player.contractUntil ?? "—" },
  ];

  const careerSorted = [...(player.career ?? [])].sort(
    (a: { yearRange: string }, b: { yearRange: string }) =>
      careerYearKey(b.yearRange) - careerYearKey(a.yearRange),
  );

  return (
    /* 
      Wrapper: no max-width restriction so it fills the parent (max-w-[1400px] from dashboard layout)
      All cards share the same full width.
    */
    <div className="space-y-4 animate-fade-in pb-10">

      {/* Back */}
      <Link href="/"
        className="btn-primary text-sm py-3 px-4 rounded-full text-mainBg inline-flex items-center gap-1.5 text-md transition-colors">
        <ArrowLeft size={13} />
        Todos los jugadores
      </Link>

      {/* ══════════════════════════════════════════════════════════════
          HERO — full width
      ══════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-8 items-start">

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
                      popoverContent: `${sharedSelectClasses.popoverContent} min-w-[200px]`
                    }}
                    startContent={
                      <span className="text-2xs font-black text-muted uppercase tracking-widest mr-2 shrink-0">Temporada</span>
                    }
                  >
                    {allStats.map((s: any) => (
                      <SelectItem
                        key={String(s.seasonId)}
                        textValue={s.season?.name || String(s.seasonId)}
                        classNames={sharedSelectItemClasses}
                      >
                        {s.season?.name || s.seasonId}
                      </SelectItem>
                    ))}
                  </Select>
                )}

                <button
                  onClick={() => fav ? removeFavorite(player.id) : addFavorite(player)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${fav ? "bg-gold/10 border-gold/30 text-gold" : "bg-input border-border text-muted hover:text-gold hover:border-gold/30"}`}
                  title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Star size={15} fill={fav ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => {
                    useScoutStore.setState({ compareList: [player] });
                    router.push('/compare');
                  }}
                  className={`btn text-mainBg h-9 px-3 btn-primary`}
                >
                  <BarChart2 size={13} />
                  Comparar
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
          ROW 2: Info chips (50%) + Donuts (50%)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Player info table */}
        <div className="card h-full">
          <p className="section-title">Detalles Profesionales</p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-1">
            {infoChips.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                <span className="text-secondary font-medium tracking-tight">{label}</span>
                <span className="text-primary font-black">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* efficiency donuts */}
        {curStat && (
          <div className="card h-full">
            <p className="section-title">Rendimiento Técnico</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 items-center justify-items-center h-full py-2">
              <DonutCircle value={parseFloat(curStat.passAccuracyPct ?? "0")} label="Pases" color="var(--green)" />
              <DonutCircle value={parseFloat(curStat.shotsOnTargetPct ?? "0")} label="Tiros arco" color="var(--blue)" />
              <DonutCircle value={Math.min(100, (curStat.goals ?? 0) / Math.max(1, curStat.matchesPlayed ?? 1) * 100 * 4)} label="Conversión" color="var(--purple)" />
              <DonutCircle value={parseFloat(curStat.dribbleSuccessRate ?? "0")} label="Regates" color="var(--gold)" />
              <DonutCircle value={parseFloat(curStat.aerialDuelsWonPct ?? "0")} label="Aéreos" color="var(--green)" />
              <DonutCircle value={player.position === "GK" ? parseFloat(curStat.savePct ?? "0") : 68} label={player.position === "GK" ? "Paradas" : "Duelos"} color="var(--blue)" />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Scouting: fortalezas / debilidades + heatmap
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Radar */}
        {radarData.length > 0 && (
          <div className="card h-full">
            <p className="section-title">Radar de rendimiento</p>
            <RadarChartComponent data={radarData} nameA={player.name} colorA="#00E094" />
          </div>
        )}
        <div className="card h-full">
          <p className="section-title">Mapa de calor</p>
          <HeatmapField grid={curStat?.heatmapData as number[][] | undefined} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Trayectoria de clubes
      ══════════════════════════════════════════════════════════════ */}
      <div className="card">
        <p className="section-title">Trayectoria</p>
        {!careerSorted.length ? (
          <p className="text-base text-muted py-8 text-center bg-white/[0.01] rounded-xl border border-white/5">
            Sin historial de clubes.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {careerSorted.map((row: { id: number; teamName: string; teamLogoUrl?: string | null; yearRange: string; appearances: number; goals: number }) => (
              <div
                key={row.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="w-10 h-10 rounded-lg bg-input border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {row.teamLogoUrl ? (
                    <Image src={row.teamLogoUrl} alt="" width={40} height={40} className="object-contain" unoptimized />
                  ) : (
                    <span className="text-xs font-black text-muted">{row.teamName[0]}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-primary truncate">{row.teamName}</p>
                  <p className="text-2xs text-secondary font-bold">{row.yearRange}</p>
                  <p className="text-2xs text-muted mt-0.5">
                    {row.appearances} PJ · {row.goals} goles
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 3: Performance Charts Group
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-fr">

        <div className="card h-full flex flex-col gap-6">
          <p className="section-title mb-0">Perfil de scouting</p>

          {/* Fortalezas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-green">Fortalezas</p>
            </div>
            {(player.strengths?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted italic">Sin datos registrados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(player.strengths as string[]).map((s: string) => (
                  <span
                    key={s}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg bg-green/15 text-green border border-green/20 leading-none"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Debilidades */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-danger">Áreas a mejorar</p>
            </div>
            {(player.weaknesses?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted italic">Sin datos registrados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(player.weaknesses as string[]).map((w: string) => (
                  <span
                    key={w}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg bg-danger/10 text-danger border border-danger/20 leading-none"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Evolution */}
        <div className="h-full">
          <EvolutionBarChart
            data={ratingHistory}
            nameA={player.name}
            mode={ratingMode}
            onChangeMode={setRatingMode}
          />
        </div>

        {/* 3. Market Value */}
        <div className="h-full">
          <MarketValueChart
            data={valueHistory}
            mode={valueMode}
            onChangeMode={setValueMode}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 4: ALL STATS — tabla compartida con compare
      ══════════════════════════════════════════════════════════════ */}
      {curStat && (
        <div className="card shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-6">
            <p className="section-title mb-0">Estadísticas completas</p>
            <span className="text-2xs text-secondary font-black bg-white/5 border border-white/10 px-2.5 py-1 rounded-md uppercase tracking-widest">
              {player.position}
            </span>
          </div>
          <PlayerStatsTable
            entries={[{ player, stat: curStat }]}
            showGeneralInfo={false}
            position={player.position}
            columns={3}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ROW 5: Injuries — full width
      ══════════════════════════════════════════════════════════════ */}
      <div className="card">
        <p className="section-title flex items-center gap-1">
          <AlertTriangle size={11} className="text-warn" />
          Lesiones
        </p>
        {!player.injuries?.length ? (
          <p className="text-base text-muted py-8 text-center bg-white/[0.01] rounded-xl border border-white/5">Sin lesiones registradas</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {player.injuries.slice(0, 8).map((inj: any) => (
              <div key={inj.id} className="card-xs p-4 flex items-start gap-3 bg-white/[0.02] border-white/5">
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
