"use client";
import React from "react";
import { X, Filter, Trash2, CheckCircle2 } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import SoccerFieldPositions from "./SoccerFieldPositions";
import { Select, SelectItem, Input } from "@nextui-org/react";
import AppButton from "../ui/AppButton";

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
      {/* Backdrop - Increased z-index to ensure it covers everything */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] transition-all duration-500 pointer-events-none
                   ${filterPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        onClick={() => setFilterPanelOpen(false)}
      />

      {/* Sidebar Panel - Widened to 850px and increased z-index */}
      <aside
        className={`fixed right-0 top-0 h-[100dvh] w-full lg:w-[850px] bg-[#0A0A0A] border-l border-white/10 z-[10000] 
                   transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.8)]
                   ${filterPanelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green/10 border border-green/20 flex items-center justify-center text-green shadow-[0_0_20px_rgba(0,224,148,0.15)]">
              <Filter size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight leading-none">Filtros Avanzados</h2>
              <p className="text-sm text-green tracking-[0.2em] uppercase font-bold mt-1">Configuración de búsqueda personalizada</p>
            </div>
          </div>
          <AppButton
            isIconOnly
            variant="light"
            onClick={() => setFilterPanelOpen(false)}
            className="w-12 h-12 text-primary/40 hover:text-primary hover:bg-white/5 rounded-2xl transition-all"
          >
            <X size={24} />
          </AppButton>
        </div>

        {/* Content with 2-Column Grid */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Left Column: Soccer Field */}
            <div className="space-y-6">
              <label className="text-xs font-black uppercase tracking-[0.25em] text-primary/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green" /> Ubicación Táctica
              </label>
              <div className="bg-black/40 p-5 rounded-[24px] border border-white/5 shadow-2xl">
                <SoccerFieldPositions
                  selected={filters.position}
                  onSelect={(pos) => update("position", pos)}
                />
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-primary/30 font-medium leading-relaxed italic">
                  * Selecciona múltiples posiciones en el campo para encontrar jugadores polifuncionales.
                </p>
              </div>
            </div>

            {/* Right Column: Other Filters */}
            <div className="space-y-8">
              {/* Club Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Club / Equipo Actual</label>
                <Select
                  items={[
                    { id: "all", name: "Todos los clubes" },
                    ...teams.map(t => ({ id: t.id.toString(), name: t.name }))
                  ]}
                  selectedKeys={filters.teamId ? [filters.teamId.toString()] : [""]}
                  onChange={(e) => update("teamId", e.target.value)}
                  placeholder="Selecciona un equipo"
                  classNames={{
                    trigger: "bg-[#141414] border border-white/10 h-14 rounded-xl shadow-none hover:border-green/50 hover:bg-[#1a1a1a] transition-all",
                    value: "text-primary font-bold text-base",
                    popoverContent: "bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xl",
                    listbox: "p-2"
                  }}
                  aria-label="Seleccionar club"
                >
                  {(item) => (
                    <SelectItem
                      key={item.id}
                      textValue={item.name}
                      className={item.id === "all" ? "text-primary/70 hover:text-primary" : "text-primary hover:text-green hover:bg-green/5"}
                    >
                      {item.name}
                    </SelectItem>
                  )}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Preferencia de Pie */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Perfil Hábil</label>
                  <Select
                    selectedKeys={filters.foot ? [filters.foot] : [""]}
                    onChange={(e) => update("foot", e.target.value)}
                    classNames={{
                      trigger: "bg-[#141414] border border-white/10 h-14 rounded-xl shadow-none hover:border-green/50 hover:bg-[#1a1a1a] transition-all",
                      value: "text-primary font-bold text-base",
                      popoverContent: "bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xl",
                    }}
                    aria-label="Seleccionar pie"
                  >
                    <SelectItem key="any" textValue="Cualquiera" className="text-primary/70">Cualquiera</SelectItem>
                    <SelectItem key="Right" textValue="Derecho" className="text-primary">Derecho</SelectItem>
                    <SelectItem key="Left" textValue="Zurdo" className="text-primary">Zurdo</SelectItem>
                    <SelectItem key="Both" textValue="Ambos" className="text-primary">Ambos</SelectItem>
                  </Select>
                </div>

                {/* Valor de mercado */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Presupuesto Máx (M€)</label>
                  <Input
                    type="number"
                    value={filters.marketValueMax}
                    onChange={(e) => update("marketValueMax", e.target.value)}
                    placeholder="Ej: 2.5"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "h-14 bg-[#141414] border-white/10 rounded-xl hover:border-green/50 hover:bg-[#1a1a1a] transition-all group-data-[focus=true]:border-green",
                      input: "text-base font-bold text-primary placeholder:text-primary/15"
                    }}
                  />
                </div>
              </div>

              {/* Rango de Edad */}
              <div className="space-y-5 bg-white/[0.01] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Rango de Edad</label>
                  <span className="text-sm font-black text-green bg-green/10 px-4 py-1.5 rounded-full border border-green/20">
                    {filters.ageMin || 15} — {filters.ageMax || 45} Años
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-2xs uppercase font-bold text-primary/20 ml-2">Mínima</span>
                    <Input
                      type="number"
                      placeholder="15"
                      value={filters.ageMin}
                      onChange={(e) => update("ageMin", e.target.value)}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "h-14 bg-[#141414] border-white/10 rounded-xl hover:border-green/50 group-data-[focus=true]:border-green",
                        input: "text-center text-base font-bold text-primary"
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-2xs uppercase font-bold text-primary/20 ml-2">Máxima</span>
                    <Input
                      type="number"
                      placeholder="45"
                      value={filters.ageMax}
                      onChange={(e) => update("ageMax", e.target.value)}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "h-14 bg-[#141414] border-white/10 rounded-xl hover:border-green/50 group-data-[focus=true]:border-green",
                        input: "text-center text-base font-bold text-primary"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/[0.08] bg-black/60 flex gap-5 relative z-10 backdrop-blur-md">
          <AppButton
            onClick={onReset}
            variant="danger"
            className="flex-1 h-16 font-bold tracking-wider rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-primary transition-all shadow-lg"
          >
            <Trash2 size={20} className="mr-2" />
            Limpiar Filtros
          </AppButton>
          <AppButton
            onClick={() => setFilterPanelOpen(false)}
            variant="primary"
            className="flex-[2] h-16 font-black tracking-widest rounded-2xl bg-green text-mainBg hover:bg-green-dark hover:shadow-[0_15px_35px_rgba(0,224,148,0.3)] transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle2 size={22} />
            APLICAR CAMBIOS
          </AppButton>
        </div>
      </aside>
    </>
  );
}