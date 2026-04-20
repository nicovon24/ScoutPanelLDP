"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown, TrendingUp, User } from "lucide-react";
import type { Player } from "@/types";
import FlagImg from "@/components/ui/FlagImg";
import { posStyle } from "@/lib/utils";

interface Props {
  players: Player[];
  loading?: boolean;
  sortBy?: string;
  onSort?: (sort: string) => void;
}

function SortIcon({ col, sortBy }: { col: string; sortBy?: string }) {
  if (!sortBy || !sortBy.startsWith(col)) return <ChevronsUpDown size={11} className="text-muted/40" />;
  return sortBy.endsWith("asc")
    ? <ChevronUp size={11} className="text-green" />
    : <ChevronDown size={11} className="text-green" />;
}

const COLS: { key: string; label: string; sortable?: boolean; align?: "right" }[] = [
  { key: "position",    label: "Posición" },
  { key: "nationality", label: "Nac." },
  { key: "team",        label: "Club" },
  { key: "value",       label: "Valor",  sortable: true, align: "right" },
  { key: "rating",      label: "Rating", sortable: true, align: "right" },
];

export default function PlayerTable({ players, loading, sortBy, onSort }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse bg-white/[0.02] rounded-xl" />
        ))}
      </div>
    );
  }

  if (players.length === 0) return null;

  const handleSort = (col: string) => {
    if (!onSort) return;
    const current = sortBy ?? "";
    if (current.startsWith(col)) {
      onSort(current.endsWith("asc") ? `${col}_desc` : `${col}_asc`);
    } else {
      onSort(`${col}_desc`);
    }
  };

  return (
    <div className="relative w-full min-w-0">
      <div
        className="overflow-x-auto overscroll-x-contain rounded-2xl border border-white/[0.05] bg-card/30 backdrop-blur-sm [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y]"
      >
        <table className="w-full border-collapse" style={{ minWidth: 580 }}>
          <thead>
            <tr className="border-b border-white/[0.05]">
              {/* Jugador — sticky solo en lg+ (móvil: toda la fila scrollea junta) */}
              <th
                className="z-10 bg-[#0e0e0e] px-4 sm:px-6 py-3.5 text-left lg:sticky lg:left-0
                           text-[10px] font-black uppercase tracking-widest text-muted
                           border-r border-white/[0.04]"
              >
                Jugador
              </th>

              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-3 sm:px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted
                              bg-white/[0.02] whitespace-nowrap select-none
                              ${col.align === "right" ? "text-right" : "text-left"}
                              ${col.sortable ? "cursor-pointer hover:text-primary transition-colors" : ""}
                              ${sortBy?.startsWith(col.key) ? "text-green" : ""}`}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === "right" ? "float-right" : ""}`}>
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} sortBy={sortBy} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {players.map((p, i) => {
              const rating = Number(p.stats?.[0]?.sofascoreRating);
              const rColor = rating >= 7.5 ? "text-green" : rating >= 7.0 ? "text-gold" : "text-secondary";

              return (
                <tr
                  key={p.id}
                  className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] group
                              ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"}`}
                >
                  {/* Jugador — sticky solo en lg+ */}
                  <td className="z-10 bg-inherit px-4 sm:px-6 py-3 border-r border-white/[0.04] lg:sticky lg:left-0">
                    <Link href={`/players/${p.id}`} className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-input border border-white/[0.05] overflow-hidden
                                      flex items-center justify-center flex-shrink-0
                                      transition-all group-hover:border-green/20">
                        {p.photoUrl
                          ? <Image src={p.photoUrl} alt={p.name} width={40} height={40}
                              className="object-cover transition-transform group-hover:scale-105" unoptimized />
                          : <User size={18} className="text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-primary truncate group-hover:text-green transition-colors">
                          {p.name}
                        </p>
                      </div>
                    </Link>
                  </td>

                  {/* Posición */}
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`badge text-[10px] font-black ${posStyle(p.position)}`}>
                      {p.position}
                    </span>
                  </td>

                  {/* Nacionalidad */}
                  <td className="px-3 sm:px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {p.nationality && <FlagImg nationality={p.nationality} size={13} />}
                      <span className="text-sm text-secondary font-medium whitespace-nowrap hidden sm:inline">
                        {p.nationality ?? "—"}
                      </span>
                    </div>
                  </td>

                  {/* Club */}
                  <td className="px-3 sm:px-5 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.team?.logoUrl && (
                        <Image src={p.team.logoUrl} alt="" width={18} height={18}
                          className="object-contain flex-shrink-0" unoptimized />
                      )}
                      <span className="text-sm text-secondary font-medium truncate max-w-[120px]">
                        {p.team?.name ?? "—"}
                      </span>
                    </div>
                  </td>

                  {/* Valor */}
                  <td className="px-3 sm:px-5 py-3 text-right">
                    <span className="text-sm font-black text-green whitespace-nowrap">
                      {p.marketValueM ? `€${p.marketValueM}M` : "—"}
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="px-3 sm:px-5 py-3 text-right">
                    <div className={`flex items-center justify-end gap-1 font-black ${rColor}`}>
                      <TrendingUp size={12} />
                      <span className="text-sm">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile scroll gradient hint */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent
                      pointer-events-none rounded-r-2xl sm:hidden" />
    </div>
  );
}
