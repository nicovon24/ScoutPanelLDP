"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown, TrendingUp } from "lucide-react";
import type { LeaderboardEntry, LeaderboardMetric } from "@/types";
import type { ColDef } from "@/lib/analyticsConfig";
import { formatCell } from "@/lib/analyticsConfig";
import FlagImg from "@/components/ui/FlagImg";

// ── Sub-components ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 text-gold text-xs font-black flex items-center justify-center">1</span>
  );
  if (rank === 2) return (
    <span className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 text-primary/70 text-xs font-black flex items-center justify-center">2</span>
  );
  if (rank === 3) return (
    <span className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black flex items-center justify-center">3</span>
  );
  return (
    <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-muted">{rank}</span>
  );
}

interface SortIconProps {
  col: LeaderboardMetric | "matchesPlayed";
  metric: LeaderboardMetric;
  sortDir: "asc" | "desc";
}
function SortIcon({ col, metric, sortDir }: SortIconProps) {
  if (col === "matchesPlayed") return null;
  if (col !== metric) return <ChevronsUpDown size={11} className="text-muted/40" />;
  return sortDir === "asc"
    ? <ChevronUp   size={11} className="text-green" />
    : <ChevronDown size={11} className="text-green" />;
}

function RatingCell({ value }: { value: number }) {
  const color = value >= 7.5 ? "text-green" : value >= 7.0 ? "text-gold" : "text-secondary";
  return <span className={`font-black ${color}`}>{value > 0 ? value.toFixed(1) : "—"}</span>;
}

// ── Table skeleton ─────────────────────────────────────────────────────────────

export function LeagueTableSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.05] overflow-hidden">
      <div className="h-12 bg-white/[0.02] border-b border-white/[0.05]" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-14 border-b border-white/[0.03] animate-pulse"
          style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }} />
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
      <TrendingUp size={28} className="text-muted mb-3" />
      <p className="text-secondary font-bold">
        {filtered ? "Sin resultados para esa búsqueda" : "Sin datos para esta selección"}
      </p>
      <p className="text-muted text-sm mt-1">
        {filtered ? "Probá con otro nombre" : "Probá con otra temporada o posición"}
      </p>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface Props {
  entries: LeaderboardEntry[];
  cols: ColDef[];
  metric: LeaderboardMetric;
  sortDir: "asc" | "desc";
  onSort: (col: LeaderboardMetric) => void;
  loading?: boolean;
  isFiltered?: boolean;
}

export default function LeagueTable({ entries, cols, metric, sortDir, onSort, loading, isFiltered }: Props) {
  if (loading) return <LeagueTableSkeleton />;
  if (entries.length === 0) return <EmptyState filtered={!!isFiltered} />;

  return (
    /* Scroll wrapper with fade-right on mobile to hint horizontal scroll */
    <div className="relative">
      <div className="overflow-x-auto rounded-2xl border border-white/[0.05] bg-card/30 backdrop-blur-sm">
        <table className="w-full border-collapse" style={{ minWidth: 540 }}>
          <thead>
            <tr className="border-b border-white/[0.05]">
              {/* # — sticky */}
              <th className="sticky left-0 z-10 bg-[#0e0e0e] px-3 sm:px-4 py-3 text-left
                             text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted w-10">
                #
              </th>

              {/* Jugador — sticky */}
              <th className="sticky left-10 z-10 bg-[#0e0e0e] px-3 sm:px-4 py-3 text-left
                             text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted
                             border-r border-white/[0.04]">
                Jugador
              </th>

              {/* Dynamic columns */}
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort(col.key as LeaderboardMetric)}
                  className={`bg-white/[0.02] px-3 sm:px-4 py-3 text-right text-[9px] sm:text-[10px]
                              font-black uppercase tracking-widest whitespace-nowrap select-none
                              ${col.sortable ? "cursor-pointer hover:text-primary transition-colors" : ""}
                              ${col.key === metric ? "text-green" : "text-muted"}`}
                >
                  <span className="inline-flex items-center gap-1 float-right">
                    {col.label}
                    <SortIcon col={col.key} metric={metric} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] group
                            ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"}`}
              >
                {/* Rank — sticky */}
                <td className="sticky left-0 z-10 bg-inherit px-3 sm:px-4 py-2.5 sm:py-3">
                  <RankBadge rank={entry.rank} />
                </td>

                {/* Player cell — sticky */}
                <td className="sticky left-10 z-10 bg-inherit px-3 sm:px-4 py-2.5 sm:py-3
                               border-r border-white/[0.04]">
                  <Link href={`/players/${entry.id}`} className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-input border border-white/[0.05]
                                    overflow-hidden items-center justify-center flex-shrink-0">
                      {entry.photoUrl
                        ? <Image src={entry.photoUrl} alt={entry.name} width={36} height={36} className="object-cover" unoptimized />
                        : <span className="text-xs font-black text-muted">{entry.name[0]}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-primary truncate group-hover:text-green transition-colors">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                          {entry.position}
                        </span>
                        {entry.teamLogoUrl && (
                          <Image src={entry.teamLogoUrl} alt="" width={13} height={13} className="object-contain hidden sm:block" unoptimized />
                        )}
                        {entry.teamName && (
                          <span className="text-[9px] sm:text-[10px] text-muted truncate hidden sm:inline">{entry.teamName}</span>
                        )}
                        {entry.nationality && (
                          <FlagImg nationality={entry.nationality} size={10} />
                        )}
                      </div>
                    </div>
                  </Link>
                </td>

                {/* Dynamic stat cells */}
                {cols.map((col) => {
                  const raw      = entry[col.key as keyof LeaderboardEntry] as number | undefined;
                  const isActive = col.key === metric;
                  return (
                    <td key={col.key} className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                      {col.key === "rating" ? (
                        <RatingCell value={entry.rating} />
                      ) : (
                        <span className={`text-xs sm:text-sm font-bold tabular-nums
                                          ${isActive ? "text-primary" : "text-secondary"}`}>
                          {formatCell(raw, col.format)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile scroll hint gradient */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent
                      pointer-events-none rounded-r-2xl sm:hidden" />
    </div>
  );
}
