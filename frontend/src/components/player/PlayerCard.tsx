"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, TrendingUp, DollarSign } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";

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
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}

const COUNTRY_CODES: Record<string, string> = {
  "Argentina": "ar",
  "Uruguay": "uy",
  "Paraguay": "py",
  "Brazil": "br",
  "Chile": "cl",
  "Colombia": "co",
  "Ecuador": "ec",
  "Peru": "pe",
  "Venezuela": "ve",
  "Bolivia": "bo",
  "Spain": "es",
  "Italy": "it",
  "France": "fr",
  "Germany": "de",
  "Armenia": "am",
  "Mexico": "mx",
  "USA": "us",
  "England": "gb",
  "Portugal": "pt",
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

export default function PlayerCard({ player }: { player: Player }) {
  const { isFavorite, addFavorite, removeFavorite } = useScoutStore();
  const fav = isFavorite(player.id);
  const age = calcAge(player.dateOfBirth);
  const stat = player.stats?.[0];
  const rating = stat?.sofascoreRating ? parseFloat(stat.sofascoreRating) : null;

  const ratingColor = rating
    ? rating >= 7.5 ? "text-green" : rating >= 7.0 ? "text-gold" : "text-secondary"
    : "text-muted";

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fav ? removeFavorite(player.id) : addFavorite(player);
  };

  return (
    <Link href={`/players/${player.id}`}>
      <div className="card group hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-500 p-5 space-y-4
                      bg-gradient-to-br from-[#0F0F0F] to-[#141414] relative overflow-hidden border-white/[0.03]">

        {/* Subtle green gradient overlay inside the card (very faint) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green/5 blur-[60px] -mr-16 -mt-16 rounded-full" />

        {/* Top bar: Position, Flag & Club Shield */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <span className={`badge text-[11px] px-3 py-0.5 ${getPositionStyle(player.position)} bg-opacity-20 font-black`}>
              {player.position}
            </span>
            {getFlagUrl(player.nationality) && (
              <div className="flex items-center gap-2">
                <div className="relative w-4.5 h-3 overflow-hidden rounded-[2px] shadow-sm flex-shrink-0">
                  <Image src={getFlagUrl(player.nationality)!} alt={player.nationality || ""} fill className="object-cover" unoptimized />
                </div>
                <span className="text-[11px] text-muted font-bold uppercase tracking-wider leading-none">
                  {player.nationality}
                </span>
              </div>
            )}
          </div>

          {player.team?.logoUrl && (
            <div className="relative w-6 h-6 flex-shrink-0 transition-all duration-300">
              <Image src={player.team.logoUrl} alt={player.team.name} fill className="object-contain" unoptimized />
            </div>
          )}
        </div>

        {/* Center: Compact Avatar & Info */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.05] flex-shrink-0
                            overflow-hidden flex items-center justify-center
                            text-xl font-black text-muted transition-all duration-300 group-hover:border-green/30 group-hover:shadow-[0_0_15px_rgba(0,224,148,0.1)]">
              {player.photoUrl
                ? <Image src={player.photoUrl} alt={player.name} width={56} height={56}
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700" unoptimized />
                : player.name[0]}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-[16px] font-black text-primary truncate leading-tight group-hover:text-green transition-colors tracking-tight">
              {player.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-secondary font-bold">{age} años</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              {player.team?.name && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] text-muted truncate font-medium">{player.team.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Footer: Stats & Value */}
        <div className="pt-6 border-t border-white/[0.05] space-y-5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[13px]">
              {(() => {
                const p = player.position?.toUpperCase();
                const isGK = p === "GK";
                const isDEF = ["CB", "LB", "RB"].includes(p);
                const isMID = ["CAM", "CM", "CDM"].includes(p);

                if (isGK) {
                  return (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">VI</span>
                        <span className="text-primary font-bold">{stat?.cleanSheets ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">Saves</span>
                        <span className="text-primary font-bold">{stat?.savePct ?? 0}%</span>
                      </div>
                    </>
                  );
                } else if (isDEF) {
                  return (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">Tackles</span>
                        <span className="text-primary font-bold">{stat?.tackles ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">Int.</span>
                        <span className="text-primary font-bold">{stat?.interceptions ?? 0}</span>
                      </div>
                    </>
                  );
                } else if (isMID) {
                  return (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">Asist.</span>
                        <span className="text-primary font-bold">{stat?.assists ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">xA</span>
                        <span className="text-primary font-bold">{stat?.xaPerGame ?? "0.0"}</span>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">Goles</span>
                        <span className="text-primary font-bold">{stat?.goals ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted uppercase font-bold tracking-tighter">xG</span>
                        <span className="text-primary font-bold">{stat?.xgPerGame ?? "0.0"}</span>
                      </div>
                    </>
                  );
                }
              })()}
            </div>

            {player.marketValueM && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted uppercase font-bold tracking-tighter">Valor</span>
                <span className="text-gold font-bold text-[14px]">€{parseFloat(player.marketValueM).toFixed(1)}M</span>
              </div>
            )}
          </div>

          {/* Rating Bar */}
          {rating != null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-secondary uppercase tracking-widest text-[10px]">Season Rating</span>
                <span className="text-green">{rating.toFixed(1)}</span>
              </div>
              <div className="h-[6px] bg-input rounded-full overflow-hidden border border-border/20">
                <div
                  className="h-full rounded-full bg-green transition-all duration-700 ease-out"
                  style={{
                    width: `${(rating / 10) * 100}%`,
                    boxShadow: "0 0 8px rgba(0, 224, 148, 0.3)"
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
