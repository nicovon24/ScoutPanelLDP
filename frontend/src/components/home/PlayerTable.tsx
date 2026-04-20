"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, User } from "lucide-react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, type SortDescriptor } from "@nextui-org/react";
import type { Player } from "@/types";

interface Props {
  players: Player[];
  loading?: boolean;
  sortBy?: string;
  onSort?: (sort: string) => void;
}

export default function PlayerTable({ players, loading, sortBy, onSort }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse bg-white/[0.02] rounded-xl" />
        ))}
      </div>
    );
  }

  if (players.length === 0) return null;

  const sortDescriptor: SortDescriptor | undefined = sortBy ? {
    column: sortBy.split("_")[0],
    direction: sortBy.split("_")[1] === "asc" ? "ascending" : "descending"
  } : undefined;

  const handleSortChange = (descriptor: SortDescriptor) => {
    if (onSort) {
      const order = descriptor.direction === "ascending" ? "asc" : "desc";
      onSort(`${descriptor.column}_${order}`);
    }
  };

  return (
    <Table 
      aria-label="Tabla de explorador"
      removeWrapper
      sortDescriptor={sortDescriptor}
      onSortChange={handleSortChange}
      classNames={{
        base: "overflow-x-auto rounded-2xl border border-white/[0.05] bg-card/30 backdrop-blur-sm",
        table: "w-full border-collapse",
        thead: "[&>tr]:first:shadow-none",
        th: "bg-white/[0.02] border-b border-white/[0.05] px-6 py-4 text-xs font-black uppercase tracking-widest text-muted",
        td: "px-6 py-4 border-b border-white/[0.03] group-data-[hover=true]:bg-white/[0.02]",
        tr: "transition-colors group",
      }}
    >
      <TableHeader>
        <TableColumn key="name" allowsSorting>Abonado / Jugador</TableColumn>
        <TableColumn key="position">Posición</TableColumn>
        <TableColumn key="nationality">Nacionalidad</TableColumn>
        <TableColumn key="team">Club</TableColumn>
        <TableColumn key="value" align="end" className="text-right" allowsSorting>Valor</TableColumn>
        <TableColumn key="rating" align="end" className="text-right" allowsSorting>Rating</TableColumn>
      </TableHeader>
      <TableBody items={players}>
        {(p) => {
          const rating = Number(p.stats?.[0]?.sofascoreRating);
          const rColor = rating >= 7.5 ? "text-green" : rating >= 7.0 ? "text-gold" : "text-primary";

          return (
            <TableRow key={p.id} className="cursor-default">
              <TableCell>
                <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-input border border-white/[0.05] overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:border-green/20">
                    {p.photoUrl
                      ? <Image src={p.photoUrl} alt={p.name} width={44} height={44} className="object-cover transition-transform group-hover:scale-110" unoptimized />
                      : <User size={20} className="text-muted" />}
                  </div>
                  <div>
                    <p className="text-base font-bold text-primary transition-colors hover:text-green">{p.name}</p>
                    <p className="text-sm text-muted">Apertura 2026</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <span className="badge text-2xs font-black bg-white/5">{p.position}</span>
              </TableCell>
              <TableCell>
                <span className="text-base text-secondary font-medium">{p.nationality}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {p.team?.logoUrl && <Image src={p.team.logoUrl} alt="" width={18} height={18} className="object-contain" unoptimized />}
                  <span className="text-base text-secondary font-medium">{p.team?.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-base font-bold text-primary">€{p.marketValueM}M</span>
              </TableCell>
              <TableCell className="text-right">
                <div className={`flex items-center justify-end gap-1.5 font-black ${rColor}`}>
                  <TrendingUp size={14} />
                  {rating || "N/A"}
                </div>
              </TableCell>
            </TableRow>
          );
        }}
      </TableBody>
    </Table>
  );
}
