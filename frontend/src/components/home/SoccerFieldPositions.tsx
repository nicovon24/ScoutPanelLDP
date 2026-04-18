"use client";
import React from "react";

const POSITIONS = [
  // Delanteros
  { id: "CF", label: "CF", x: 50, y: 15, group: "att" },
  { id: "SS", label: "SS", x: 50, y: 30, group: "att" },
  { id: "LW", label: "LW", x: 20, y: 20, group: "att" },
  { id: "RW", label: "RW", x: 80, y: 20, group: "att" },
  // Medios
  { id: "CAM", label: "CAM", x: 50, y: 45, group: "mid" },
  { id: "CM",  label: "CM",  x: 50, y: 60, group: "mid" },
  { id: "CDM", label: "CDM", x: 50, y: 75, group: "mid" },
  // Defensas
  { id: "CB", label: "CB", x: 50, y: 88, group: "def" },
  { id: "LB", label: "LB", x: 15, y: 85, group: "def" },
  { id: "RB", label: "RB", x: 85, y: 85, group: "def" },
  // Arquero
  { id: "GK", label: "GK", x: 50, y: 96, group: "gk" },
];

interface Props {
  selected: string;
  onSelect: (pos: string) => void;
}

export default function SoccerFieldPositions({ selected, onSelect }: Props) {
  return (
    <div className="relative w-full aspect-[2/3] bg-[#0E2D1B] rounded-xl overflow-hidden border border-white/5 shadow-inner">
      {/* Field Lines */}
      <div className="absolute inset-4 border-2 border-white/10 rounded-sm">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/10 rounded-full" />
        {/* Areas */}
        <div className="absolute top-0 left-1/4 right-1/4 h-16 border-2 border-t-0 border-white/10" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-2 border-b-0 border-white/10" />
      </div>

      {/* Positions */}
      {POSITIONS.map((p) => {
        const active = selected === p.id;
        const groupColor = p.group === "att" ? "bg-danger" : p.group === "mid" ? "bg-purple" : p.group === "def" ? "bg-blue" : "bg-gold";
        
        return (
          <button
            key={p.id}
            onClick={() => onSelect(active ? "" : p.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full 
                        flex items-center justify-center text-[10px] font-black transition-all duration-200
                        ${active 
                          ? `${groupColor} text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110 ring-2 ring-white/50` 
                          : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.id}
          </button>
        );
      })}
    </div>
  );
}
