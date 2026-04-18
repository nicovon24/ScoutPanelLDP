import React from "react";
import { ArrowUpDown } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SortSelect({ value, onChange }: Props) {
  return (
    <div className="relative flex items-center bg-card border border-white/[0.05] rounded-xl h-12 overflow-hidden hover:border-white/10 transition-colors">
      <div className="flex items-center justify-center pl-4 pr-2 text-muted bg-white/[0.02] border-r border-white/[0.05] h-full pointer-events-none">
        <ArrowUpDown size={16} />
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-[12px] font-bold text-primary pl-3 pr-10 h-full outline-none cursor-pointer w-40"
      >
        <option value="">Ordenar por: Defecto</option>
        <option value="marketValue_desc">Mayor Valor</option>
        <option value="marketValue_asc">Menor Valor</option>
        <option value="age_asc">Más Jóvenes</option>
        <option value="age_desc">Más Veteranos</option>
        <option value="rating_desc">Mejor Rating</option>
      </select>
      <div className="absolute right-3 pointer-events-none text-muted">
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
