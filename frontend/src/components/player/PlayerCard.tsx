"use client";
import Image from "next/image";
import Link from "next/link";
import { useScoutStore } from "@/store/useScoutStore";
import { Card } from "@nextui-org/react";

interface Player {
  id: number;
  name: string;
  position: string;
  nationality?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  marketValueM?: string;
  team?: { name: string; logoUrl?: string };
  stats?: {
    sofascoreRating?: string;
    goals?: number;
    assists?: number;
    matchesPlayed?: number;
    tackles?: number;
    interceptions?: number;
    cleanSheets?: number;
    savePct?: number;
    passAccuracyPct?: number;
    xgPerGame?: string;
    xaPerGame?: string;
  }[];
}

function getPositionStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "text-blue-400 bg-blue-400/10 border-blue-400/20"; // Attack
  if (["CAM", "CM", "CDM"].includes(p)) return "text-green-400 bg-green-400/10 border-green-400/20"; // Mid
  if (["CB", "LB", "RB"].includes(p)) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"; // Def
  return "text-orange-400 bg-orange-400/10 border-orange-400/20"; // GK
}

const COUNTRY_CODES: Record<string, string> = {
  "Argentina": "ar", "Uruguay": "uy", "Paraguay": "py", "Brazil": "br",
  "Chile": "cl", "Colombia": "co", "Ecuador": "ec", "Peru": "pe",
  "Venezuela": "ve", "Bolivia": "bo", "Spain": "es", "Italy": "it",
  "France": "fr", "Germany": "de", "Armenia": "am", "Mexico": "mx",
  "USA": "us", "England": "gb", "Portugal": "pt",
};

function getFlagUrl(nationality?: string) {
  if (!nationality) return null;
  const code = COUNTRY_CODES[nationality];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PlayerCardV2({ player }: { player: Player }) {
  const { isFavorite, addFavorite, removeFavorite } = useScoutStore();
  const fav = isFavorite(player.id);
  const age = calcAge(player.dateOfBirth);
  const stat = player.stats?.[0];
  const rating = stat?.sofascoreRating ? parseFloat(stat.sofascoreRating) : null;

  const ratingColor = rating
    ? rating >= 7.5 ? "text-green border-green/30" : rating >= 7.0 ? "text-yellow-400 border-yellow-400/30" : "text-primary/70 border-white/10"
    : "text-primary/30 border-white/5";

  return (
    <Card
      as={Link}
      href={`/players/${player.id}`}
      disableAnimation
      classNames={{
        base: "w-full group bg-[#0d0d0d] border border-white/5 rounded-[20px] overflow-hidden hover:border-green/40 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,224,148,0.12)] hover:-translate-y-1 active:scale-100"
      }}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-green/5 blur-[70px] rounded-full group-hover:bg-green/15 transition-all duration-700 pointer-events-none" />

      <div className="p-5 flex flex-col h-full relative z-10">

        {/* TOP: Pos, Flag, Value */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2.5 items-center">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${getPositionStyle(player.position)}`}>
              {player.position}
            </span>
            {getFlagUrl(player.nationality) && (
              <div className="relative w-5 h-3.5 rounded-sm overflow-hidden shadow-sm">
                <Image src={getFlagUrl(player.nationality)!} alt={player.nationality || ""} fill className="object-cover" unoptimized />
              </div>
            )}
          </div>

          {player.marketValueM && (
            <div className="flex flex-col items-end">
              <span className="text-2xs text-primary/40 uppercase font-bold tracking-widest mb-0.5">Valor</span>
              <span className="text-yellow-500/90 font-black text-md leading-none">€{parseFloat(player.marketValueM).toFixed(1)}M</span>
            </div>
          )}
        </div>

        {/* MID: Avatar & Main Info */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-card-2 to-black border-2 border-white/10 overflow-hidden flex-shrink-0 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.5)]  group-hover:shadow-[0_8px_30px_rgba(0,224,148,0.15)]">
            {player.photoUrl ? (
              <Image src={player.photoUrl} alt={player.name} fill className="object-cover transform group-hover:scale-110 transition-transform duration-700" unoptimized />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.05] to-transparent">
                <span className="text-2xl font-black text-primary/40 group-hover:text-green/50 transition-colors uppercase">{player.name[0]}</span>
                <div className="w-6 h-0.5 bg-green/20 mt-1 rounded-full group-hover:bg-green/40 transition-colors" />
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-md font-black text-primary truncate leading-tight transition-colors tracking-tight">
              {player.name}
            </h3>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-primary/50 font-medium">{age} años</span>
              {player.team?.name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    {player.team.logoUrl && (
                      <div className="relative w-3.5 h-3.5 flex-shrink-0">
                        <Image src={player.team.logoUrl} alt={player.team.name} fill className="object-contain" unoptimized />
                      </div>
                    )}
                    <span className="text-xs text-primary/70 truncate font-medium">{player.team.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: Stats & Rating Box */}
        <div className="mt-auto flex flex-col gap-3">

          {/* Inner Stats Box */}
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex justify-around items-center">
            {(() => {
              const p = player.position?.toUpperCase();
              const isGK = p === "GK";
              const isDEF = ["CB", "LB", "RB"].includes(p);
              const isMID = ["CAM", "CM", "CDM"].includes(p);

              const StatItem = ({ label, value }: { label: string, value: string | number }) => (
                <div className="flex flex-col items-center">
                  <span className="text-2xs text-primary/40 uppercase font-bold tracking-wider mb-1">{label}</span>
                  <span className="text-primary font-bold text-base leading-none">{value}</span>
                </div>
              );

              if (isGK) return (
                <>
                  <StatItem label="VI" value={stat?.cleanSheets ?? 0} />
                  <div className="w-[1px] h-6 bg-white/5" />
                  <StatItem label="Saves" value={`${stat?.savePct ?? 0}%`} />
                </>
              );
              if (isDEF) return (
                <>
                  <StatItem label="Tackles" value={stat?.tackles ?? 0} />
                  <div className="w-[1px] h-6 bg-white/5" />
                  <StatItem label="Int." value={stat?.interceptions ?? 0} />
                </>
              );
              if (isMID) return (
                <>
                  <StatItem label="Asist." value={stat?.assists ?? 0} />
                  <div className="w-[1px] h-6 bg-white/5" />
                  <StatItem label="xA" value={stat?.xaPerGame ?? "0.0"} />
                </>
              );
              return (
                <>
                  <StatItem label="Goles" value={stat?.goals ?? 0} />
                  <div className="w-[1px] h-6 bg-white/5" />
                  <StatItem label="xG" value={stat?.xgPerGame ?? "0.0"} />
                </>
              );
            })()}
          </div>

          {/* Rating Section */}
          {rating != null && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-2xs text-primary/40 uppercase font-black tracking-[0.15em]">Desempeño</span>
                  <span className="text-secondary font-bold text-[11px]">Temporada 2026</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg font-black text-md bg-black/60 border ${ratingColor} shadow-lg`}>
                  {rating.toFixed(1)}
                </div>
              </div>

              <div className="relative h-3 bg-white/[0.03] border border-white/5 rounded-full overflow-hidden">
                {/* Reference Markers */}
                <div className="absolute inset-0 flex justify-between px-[15%] pointer-events-none">
                  <div className="w-[1px] h-full bg-white/[0.05]" />
                  <div className="w-[1px] h-full bg-white/[0.05]" />
                  <div className="w-[1px] h-full bg-white/[0.05]" />
                </div>

                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,224,148,0.2)]"
                  style={{
                    width: `${(rating / 10) * 100}%`,
                    background: rating >= 7.5
                      ? "linear-gradient(90deg, #00C47F 0%, #00E094 100%)"
                      : rating >= 7.0
                        ? "linear-gradient(90deg, #E8A838 0%, #FACC15 100%)"
                        : "linear-gradient(90deg, #717171 0%, #A1A1AA 100%)"
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black text-muted uppercase tracking-tighter opacity-50 px-1">
                <span>Pobre</span>
                <span>Promedio</span>
                <span>Elite</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </Card>
  );
}