"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star, BarChart2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Select, SelectItem } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import { useShortlist } from "@/hooks/useShortlist";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";
import PlayerStatsTable from "@/components/player/PlayerStatsTable";
import { ChartSkeleton } from "@/components/ui/Skeleton";

// Lazy-loaded — reducen el bundle inicial y se cargan solo cuando el jugador se muestra
const RadarChartComponent = dynamic(() => import("@/components/charts/RadarChart"), {
  loading: () => <ChartSkeleton height={320} />,
  ssr: false,
});
const EvolutionBarChart = dynamic(() => import("@/components/charts/EvolutionBarChart"), {
  loading: () => <ChartSkeleton height={160} />,
  ssr: false,
});
const MarketValueChart = dynamic(() => import("@/components/charts/MarketValueChart"), {
  loading: () => <ChartSkeleton height={160} />,
  ssr: false,
});
const HeatmapField = dynamic(() => import("@/components/player/HeatmapField"), {
  loading: () => <ChartSkeleton height={180} />,
  ssr: false,
});
import { calcAge, posStyle, fmt, contractTypeLabel, careerYearKey } from "@/lib/utils";
import { buildSingleRadar } from "@/lib/radarNorm";
import { buildRatingHistory, buildValueHistory } from "@/lib/playerStats";
import DonutCircle from "@/components/player/DonutCircle";


/* ── Main Page ───────────────────────────── */
export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selSeasonId, setSelSeason] = useState<number | null>(null);
  const [ratingMode, setRatingMode] = useState<"year" | "month">("month");
  const [valueMode, setValueMode] = useState<"year" | "month">("month");

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
  const age = calcAge(player.dateOfBirth);

  const allStats = [...(player.stats ?? [])].sort((a: any, b: any) => b.season?.year - a.season?.year);
  const curStat = allStats.find((s: any) => s.seasonId === selSeasonId) ?? allStats[0];

  const ratingHistory = buildRatingHistory(player, selSeasonId, ratingMode);
  const valueHistory  = buildValueHistory(player, selSeasonId, valueMode);


  const radarData = curStat ? buildSingleRadar(curStat as Record<string, unknown>) : [];


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
              <DonutCircle
                value={player.position === "GK"
                  ? parseFloat(curStat.savePct ?? "0")
                  : Math.min(100, parseFloat(curStat.sofascoreRating ?? "0") * 10)}
                label={player.position === "GK" ? "Paradas" : "Rating"}
                color="var(--blue)"
              />
              <DonutCircle value={parseFloat(curStat.passAccuracyPct ?? "0")} label="Pases" color="var(--green)" />
              <DonutCircle value={parseFloat(curStat.shotsOnTargetPct ?? "0")} label="Tiros arco" color="var(--blue)" />
              <DonutCircle value={Math.min(100, (curStat.goals ?? 0) / Math.max(1, curStat.matchesPlayed ?? 1) * 100 * 4)} label="Conversión" color="var(--purple)" />
              <DonutCircle value={parseFloat(curStat.dribbleSuccessRate ?? "0")} label="Regates" color="var(--gold)" />
              <DonutCircle value={parseFloat(curStat.aerialDuelsWonPct ?? "0")} label="Aéreos" color="var(--green)" />
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
