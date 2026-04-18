"use client";
import React from "react";
import PlayerCard from "@/components/player/PlayerCard";

interface Props {
  players: any[];
  loading?: boolean;
}

export default function PlayerGrid({ players, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="card h-[300px] animate-pulse bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
        <p className="text-secondary font-bold text-lg">No se encontraron jugadores</p>
        <p className="text-muted text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
