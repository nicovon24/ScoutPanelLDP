"use client";
import React from "react";
import { X, Filter, Trash2 } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import SoccerFieldPositions from "./SoccerFieldPositions";

interface Props {
  teams: { id: number; name: string }[];
  filters: {
    position: string;
    teamId: string;
    foot: string;
    ageMin: string;
    ageMax: string;
    marketValueMax: string;
  };
  setFilters: (f: any) => void;
  onReset: () => void;
}

export default function FilterSidebar({ teams, filters, setFilters, onReset }: Props) {
  const { filterPanelOpen, setFilterPanelOpen } = useScoutStore();

  const update = (key: string, val: any) => {
    setFilters({ ...filters, [key]: val });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 pointer-events-none
                   ${filterPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        onClick={() => setFilterPanelOpen(false)}
      />

      {/* Sidebar Panel */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 w-[400px] bg-sidebar border-r border-white/[0.05] z-[70] 
                   transform transition-transform duration-500 ease-out flex flex-col
                   ${filterPanelOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green">
              <Filter size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-primary uppercase tracking-tight">Filtros Avanzados</h2>
              <p className="text-[10px] text-muted tracking-widest uppercase font-bold">Refina tu búsqueda</p>
            </div>
          </div>
          <button 
            onClick={() => setFilterPanelOpen(false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:bg-white/5 hover:text-primary transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section: Position */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">Posición en el campo</label>
            <SoccerFieldPositions 
              selected={filters.position} 
              onSelect={(pos) => update("position", pos)} 
            />
          </div>

          {/* Section: Team */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">Club / Equipo</label>
            <select 
              value={filters.teamId} 
              onChange={(e) => update("teamId", e.target.value)}
              className="select-field h-12 w-full bg-white/[0.02] border-white/[0.05]"
            >
              <option value="">Todos los clubes</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Pie hábil */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">Pref. Pie</label>
              <select 
                value={filters.foot} 
                onChange={(e) => update("foot", e.target.value)}
                className="select-field h-12 w-full bg-white/[0.02] border-white/[0.05]"
              >
                <option value="">Cualquiera</option>
                <option value="Right">Derecho</option>
                <option value="Left">Zurdo</option>
                <option value="Both">Ambos</option>
              </select>
            </div>

            {/* Valor de mercado */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">V. Máximo (M€)</label>
              <input 
                type="number"
                value={filters.marketValueMax}
                onChange={(e) => update("marketValueMax", e.target.value)}
                placeholder="Ej: 50"
                className="field h-12 w-full bg-white/[0.02] border-white/[0.05]"
              />
            </div>
          </div>

          {/* Edad */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">Rango de Edad</label>
              <span className="text-[11px] font-bold text-green">{filters.ageMin || 15} - {filters.ageMax || 45} años</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                placeholder="Mín"
                value={filters.ageMin}
                onChange={(e) => update("ageMin", e.target.value)}
                className="field h-11 text-center bg-white/[0.02] border-white/[0.05]"
              />
              <input 
                type="number" 
                placeholder="Máx"
                value={filters.ageMax}
                onChange={(e) => update("ageMax", e.target.value)}
                className="field h-11 text-center bg-white/[0.02] border-white/[0.05]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.05] bg-white/[0.01] flex gap-3">
          <button 
            onClick={onReset}
            className="flex-1 h-12 rounded-xl border border-white/[0.05] text-[13px] font-bold text-muted hover:text-danger hover:bg-danger/5 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Limpiar
          </button>
          <button 
            onClick={() => setFilterPanelOpen(false)}
            className="flex-[2] h-12 rounded-xl bg-green text-base text-[13px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(0,224,148,0.2)]"
          >
            Aplicar Filtros
          </button>
        </div>
      </aside>
    </>
  );
}
