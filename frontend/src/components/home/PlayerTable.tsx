"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, User } from "lucide-react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";

interface Props {
  players: any[];
  loading?: boolean;
}

export default function PlayerTable({ players, loading }: Props) {
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

  return (
    <Table 
      aria-label="Tabla de explorador"
      removeWrapper
      classNames={{
        base: "overflow-x-auto rounded-2xl border border-white/[0.05] bg-card/30 backdrop-blur-sm",
        table: "w-full border-collapse",
        thead: "[&>tr]:first:shadow-none",
        th: "bg-white/[0.02] border-b border-white/[0.05] px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted",
        td: "px-6 py-4 border-b border-white/[0.03] group-data-[hover=true]:bg-white/[0.02]",
        tr: "transition-colors group",
      }}
    >
      <TableHeader>
        <TableColumn>Abonado / Jugador</TableColumn>
        <TableColumn>Posición</TableColumn>
        <TableColumn>Nacionalidad</TableColumn>
        <TableColumn>Club</TableColumn>
        <TableColumn align="end" className="text-right">Valor</TableColumn>
        <TableColumn align="end" className="text-right">Rating</TableColumn>
      </TableHeader>
      <TableBody items={players}>
        {(p) => {
          const rating = p.stats?.[0]?.sofascoreRating;
          const rColor = rating >= 7.5 ? "text-green" : rating >= 7.0 ? "text-gold" : "text-primary";

          return (
            <TableRow key={p.id} className="cursor-default">
              <TableCell>
                <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-input border border-white/[0.05] overflow-hidden flex items-center justify-center shrink-0">
                    {p.photoUrl
                      ? <Image src={p.photoUrl} alt={p.name} width={40} height={40} className="object-cover" unoptimized />
                      : <User size={18} className="text-muted" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-primary transition-colors hover:text-green">{p.name}</p>
                    <p className="text-[12px] text-muted">Apertura 2026</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <span className="badge text-[10px] font-black bg-white/5">{p.position}</span>
              </TableCell>
              <TableCell>
                <span className="text-[13px] text-secondary font-medium">{p.nationality}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {p.team?.logoUrl && <Image src={p.team.logoUrl} alt="" width={18} height={18} className="object-contain" unoptimized />}
                  <span className="text-[13px] text-secondary font-medium">{p.team?.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-[14px] font-bold text-primary">€{p.marketValueM}M</span>
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
