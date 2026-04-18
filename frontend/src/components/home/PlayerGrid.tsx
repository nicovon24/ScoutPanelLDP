"use client";
import React from "react";
import PlayerCard from "@/components/player/PlayerCard";
import { Skeleton } from "@nextui-org/react";

interface Props {
  players: any[];
  loading?: boolean;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.06] animate-pulse ${className}`}
      style={{ animationDuration: "1.6s" }}
    />
  );
}

export default function PlayerGrid({ players, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="w-full min-h-[260px] p-[18px] flex flex-col gap-4
            bg-[#0c0c0c] rounded-[20px] border border-white/[0.05]"
          >
            {/* Top */}
            <div className="flex items-center justify-between">
              <SkeletonPulse className="w-14 h-5 rounded-full" />
              <SkeletonPulse className="w-5 h-5 rounded-full" />
            </div>

            {/* Mid */}
            <div className="flex items-center gap-3 flex-1">
              <SkeletonPulse className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <SkeletonPulse className="w-3/4 h-3 rounded" />
                <SkeletonPulse className="w-1/2 h-2.5 rounded" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3.5 border-t border-white/[0.04] pt-3.5">
              <div className="flex items-end justify-between">
                <div className="flex gap-5">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonPulse className="w-7 h-2 rounded" />
                    <SkeletonPulse className="w-5 h-3.5 rounded" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <SkeletonPulse className="w-9 h-2 rounded" />
                    <SkeletonPulse className="w-8 h-3.5 rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <SkeletonPulse className="w-9 h-2 rounded" />
                  <SkeletonPulse className="w-11 h-3.5 rounded" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <SkeletonPulse className="w-14 h-2 rounded" />
                  <SkeletonPulse className="w-7 h-2 rounded" />
                </div>
                <SkeletonPulse className="w-full h-1.5 rounded-full" />
              </div>
            </div>
          </div>
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
        <div key={player.id}>
          <PlayerCard player={player} />
        </div>
      ))}
    </div>
  );
}