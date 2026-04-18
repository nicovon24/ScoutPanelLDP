"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, TrendingUp } from "lucide-react";
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
  stats?: { sofascoreRating?: string; goals?: number; assists?: number; matchesPlayed?: number }[];
}

function getPositionStyle(pos: string) {
  const p = pos?.toUpperCase();
  if (["CF","SS","LW","RW"].includes(p)) return "pos-attack";
  if (["CAM","CM","CDM"].includes(p))    return "pos-mid";
  if (["CB","LB","RB"].includes(p))      return "pos-def";
  return "pos-gk";
}

function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PlayerCard({ player }: { player: Player }) {
  const { isFavorite, addFavorite, removeFavorite } = useScoutStore();
  const fav  = isFavorite(player.id);
  const age  = calcAge(player.dateOfBirth);
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
      <div className="card group cursor-pointer hover:-translate-y-0.5 hover:border-border-h
                      hover:shadow-glow-green/5 transition-all duration-200 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-lg bg-input border border-border flex-shrink-0
                            overflow-hidden flex items-center justify-center
                            text-base font-bold text-muted">
              {player.photoUrl
                ? <Image src={player.photoUrl} alt={player.name} width={44} height={44}
                         className="object-cover w-full h-full" unoptimized />
                : player.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-primary truncate leading-tight">
                {player.name}
              </p>
              <p className="text-[12px] text-muted truncate mt-0.5">
                {player.nationality}{age ? ` · ${age}y` : ""}
              </p>
            </div>
          </div>
          {/* Fav */}
          <button onClick={toggleFav}
                  className={`flex-shrink-0 p-1 rounded transition-colors
                              ${fav ? "text-gold" : "text-muted hover:text-gold"}`}>
            <Star size={14} fill={fav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Position + Club */}
        <div className="flex items-center gap-2">
          <span className={`badge text-[10px] ${getPositionStyle(player.position)}`}>
            {player.position}
          </span>
          {player.team?.name && (
            <div className="flex items-center gap-1.5 min-w-0">
              {player.team.logoUrl && (
                <Image src={player.team.logoUrl} alt="" width={12} height={12} unoptimized className="flex-shrink-0 opacity-70" />
              )}
              <span className="text-[12px] text-muted truncate">{player.team.name}</span>
            </div>
          )}
        </div>

        {/* Stats footer */}
        {stat && (
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            {rating != null && (
              <div className="flex items-center gap-1">
                <TrendingUp size={11} className="text-muted" />
                <span className={`text-[13px] font-bold ${ratingColor}`}>
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2.5 ml-1">
              {stat.goals != null && (
                <span className="text-[12px] text-muted">
                  <span className="font-semibold text-primary">{stat.goals}</span> G
                </span>
              )}
              {stat.assists != null && (
                <span className="text-[12px] text-muted">
                  <span className="font-semibold text-primary">{stat.assists}</span> A
                </span>
              )}
            </div>
            {player.marketValueM && (
              <div className="ml-auto text-[12px] font-semibold text-gold">
                €{parseFloat(player.marketValueM).toFixed(1)}M
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
