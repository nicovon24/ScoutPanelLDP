"use client";
import React from "react";
import AppButton from "@/components/ui/AppButton";

const POSITIONS = [
  // Delanteros
  { id: "CF", label: "CF", x: 50, y: 15, group: "att" },
  { id: "SS", label: "SS", x: 50, y: 30, group: "att" },
  { id: "LW", label: "LW", x: 20, y: 20, group: "att" },
  { id: "RW", label: "RW", x: 80, y: 20, group: "att" },
  // Medios
  { id: "CAM", label: "CAM", x: 50, y: 45, group: "mid" },
  { id: "CM", label: "CM", x: 50, y: 60, group: "mid" },
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
  const selectedArr = selected ? selected.split(",") : [];

  return (
    <div className="relative w-full aspect-[0.7] bg-[#1a3320] rounded-xl overflow-hidden border-2 border-[#34d35a]/20 shadow-inner">
      {/* Tactical Zones */}
      <div className="absolute top-0 left-0 right-0 h-[38%] bg-[#34d35a]/[0.04]" />
      <div className="absolute top-[38%] left-0 right-0 h-[24%] border-y border-[#34d35a]/15" />
      <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-[#34d35a]/[0.02]" />

      {/* Field Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] aspect-square border border-[#34d35a]/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-[#34d35a]/40 rounded-full" />
        </div>
        
        {/* Penalty Areas */}
        <div className="absolute top-0 left-[20%] right-[20%] h-[14%] border border-t-0 border-[#34d35a]/15" />
        <div className="absolute bottom-0 left-[20%] right-[20%] h-[14%] border border-b-0 border-[#34d35a]/15" />
        
        {/* Goal Areas */}
        <div className="absolute top-0 left-[35%] right-[35%] h-[5%] border-x border-b border-[#34d35a]/20 bg-[#34d35a]/[0.06]" />
        <div className="absolute bottom-0 left-[35%] right-[35%] h-[5%] border-x border-t border-[#34d35a]/20 bg-[#34d35a]/[0.06]" />
      </div>

      {/* Positions */}
      {POSITIONS.map((p) => {
        const active = selectedArr.includes(p.id);

        return (
          <AppButton
            key={p.id}
            type="button"
            variant="light"
            disableRipple
            onPress={() => {
              if (active) {
                onSelect(selectedArr.filter(x => x !== p.id).join(","));
              } else {
                onSelect([...selectedArr, p.id].join(","));
              }
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 !min-w-[34px] w-[34px] h-[34px] min-w-[34px] rounded-full 
                        text-2xs font-black transition-all duration-300 p-0
                        ${active
                ? `bg-green text-[#081009] shadow-[0_0_20px_rgba(52,211,90,0.55),0_0_40px_rgba(52,211,90,0.2)] scale-110 z-10`
                : "bg-[#0E1710]/90 text-[#7aab82] border-[1.5px] border-[#34d35a]/30 hover:border-green hover:text-green hover:bg-[#34d35a]/15 hover:scale-115"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.id}
          </AppButton>
        );
      })}
    </div>
  );
}
