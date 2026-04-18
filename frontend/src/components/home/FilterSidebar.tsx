import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Filter, Trash2, CheckCircle2 } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import SoccerFieldPositions from "./SoccerFieldPositions";
import { Select, SelectItem, Input, Avatar } from "@nextui-org/react";
import AppButton from "../ui/AppButton";
import { sharedSelectClasses, sharedSelectItemClasses } from "@/components/ui/sharedStyles";

export const POSITIONS_LIST = [
  { id: "CF", name: "CF - Centrodelantero" },
  { id: "SS", name: "SS - Mediapunta" },
  { id: "LW", name: "LW - Extremo" },
  { id: "RW", name: "RW - Extremo" },
  { id: "CAM", name: "CAM - Volante Ofensivo" },
  { id: "CM", name: "CM - Mediocentro" },
  { id: "CDM", name: "CDM - Volante Tapón" },
  { id: "CB", name: "CB - Defensa Central" },
  { id: "LB", name: "LB - Lateral" },
  { id: "RB", name: "RB - Lateral" },
  { id: "GK", name: "GK - Arquero" },
];

interface Props {
  teams: { id: number; name: string }[];
  filters: {
    position: string;
    teamId: string;
    foot: string;
    ageMin: string;
    ageMax: string;
    heightMin: string;
    heightMax: string;
    minRating: string;
    marketValueMax: string;
  };
  setFilters: (f: any) => void;
  onReset: () => void;
}

export default function FilterSidebar({ teams, filters, setFilters, onReset }: Props) {
  const { filterPanelOpen, setFilterPanelOpen } = useScoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (filterPanelOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [filterPanelOpen]);

  const update = (key: string, val: any) => {
    setFilters({ ...filters, [key]: val });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="relative z-[99999]">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] transition-all duration-500 pointer-events-none
                   ${filterPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        onClick={() => setFilterPanelOpen(false)}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed right-0 top-0 h-[100dvh] w-full lg:w-[850px] bg-[#0E1710] border-l border-[#34d35a]/20 z-[100000] overflow-hidden
                 transform transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.9)]
                   ${filterPanelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Glow effect */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] bg-green/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative p-5 lg:p-7 border-b border-white/[0.05] flex items-center justify-between bg-[#0E1710] z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-[36px] h-[36px] lg:w-[42px] lg:h-[42px] rounded-[10px] bg-[#34d35a]/15 border border-[#34d35a]/30 flex items-center justify-center text-green shadow-[0_0_15px_rgba(52,211,90,0.1)]">
              <Filter size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[18px] lg:text-[22px] font-black text-primary uppercase tracking-tight leading-none font-sans">Filtros Avanzados</h2>
              <p className="text-[9px] lg:text-[10px] text-green tracking-[0.15em] uppercase font-bold mt-1 lg:mt-1.5 opacity-80">Configuración de búsqueda</p>
            </div>
          </div>
          <button
            onClick={() => setFilterPanelOpen(false)}
            className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center text-green bg-[#34d35a]/10 hover:bg-[#34d35a]/20 border border-[#34d35a]/20 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,90,0.1)]"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-10 relative z-10 custom-scrollbar overscroll-contain">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

            {/* Left Column: Posición */}
            <div className="space-y-4 lg:space-y-6">
              <label className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-[#7aab82] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_#34d35a]" /> Posición
              </label>

              {/* Mobile View: Multi-Select */}
              <div className="block lg:hidden">
                <Select
                  selectionMode="multiple"
                  items={POSITIONS_LIST}
                  selectedKeys={filters.position ? new Set(filters.position.split(",")) : new Set()}
                  onSelectionChange={(keys) => {
                    const keysArray = Array.from(keys);
                    update("position", keysArray.join(","));
                  }}
                  placeholder="Ej: CM, CAM"
                  classNames={{
                    trigger: `${sharedSelectClasses.trigger} h-[46px]`,
                    value: sharedSelectClasses.value,
                    popoverContent: sharedSelectClasses.popoverContent,
                  }}
                  renderValue={(items) => (
                    <div className="flex flex-wrap gap-1">
                      {items.map((item) => (
                        <span key={item.key} className="bg-green/10 text-green text-[10px] px-2 py-0.5 rounded-md font-black">
                          {item.key}
                        </span>
                      ))}
                    </div>
                  )}
                  aria-label="Seleccionar posiciones"
                >
                  {(item) => (
                    <SelectItem 
                      key={item.id} 
                      textValue={item.id} 
                      classNames={sharedSelectItemClasses}
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-green font-black w-8">{item.id}</span>
                        <span className="text-xs">{item.name.replace(item.id + " - ", "")}</span>
                      </div>
                    </SelectItem>
                  )}
                </Select>
              </div>

              {/* Desktop View: Soccer Pitch */}
              <div className="hidden lg:block bg-[#1a3320] p-6 rounded-[24px] border border-[#34d35a]/20 shadow-[0_0_50px_rgba(52,211,90,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#34d35a_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="relative transform transition-transform duration-500 group-hover:scale-[1.01]">
                  <SoccerFieldPositions
                    selected={filters.position}
                    onSelect={(pos) => update("position", pos)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Other Filters */}
            <div className="space-y-6 lg:space-y-8">
              {/* Club & Perfil */}
              <div className="space-y-4 lg:space-y-5">
                <label className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-[#7aab82] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_#34d35a]" /> Club & Perfil
                </label>

                <div className="space-y-2">
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Club actual</span>
                  <Select
                    items={[
                      { id: "all", name: "Todos los clubes", logoUrl: "" },
                      ...[...teams].sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ 
                        id: t.id.toString(), 
                        name: t.name, 
                        logoUrl: (t as any).logoUrl || (t as any).imagePath 
                      }))
                    ]}
                    selectedKeys={filters.teamId ? [filters.teamId.toString()] : []}
                    onChange={(e) => update("teamId", e.target.value)}
                    placeholder="Seleccioná un equipo"
                    renderValue={(items) => {
                      return items.map((item) => (
                        <div key={item.key} className="flex gap-2 items-center">
                          {item.data?.logoUrl && (
                            <Avatar 
                              src={item.data.logoUrl} 
                              alt={item.data.name} 
                              className="w-5 h-5 flex-shrink-0 bg-transparent"
                              fallback={<div className="bg-[#34d35a]/20 text-[#34d35a] font-bold w-full h-full flex items-center justify-center text-[10px]">{item.data.name?.substring(0,2)}</div>}
                            />
                          )}
                          <span className="text-sm font-bold text-[#7aab82]">{item.data?.name}</span>
                        </div>
                      ));
                    }}
                    classNames={{
                      trigger: `${sharedSelectClasses.trigger} h-[46px] lg:h-[50px]`,
                      value: sharedSelectClasses.value,
                      popoverContent: sharedSelectClasses.popoverContent,
                    }}
                    aria-label="Seleccionar club"
                  >
                    {(item) => (
                      <SelectItem 
                        key={item.id} 
                        textValue={item.name} 
                        classNames={sharedSelectItemClasses}
                      >
                        {item.id === "all" ? (
                          <span>{item.name}</span>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <Avatar alt={item.name} fallback={<div className="bg-[#34d35a]/20 text-[#34d35a] font-bold w-full h-full flex items-center justify-center text-[10px]">{item.name.substring(0,2)}</div>} className="w-5 h-5 flex-shrink-0 bg-transparent" src={item.logoUrl} />
                            <span className="text-xs font-bold">{item.name}</span>
                          </div>
                        )}
                      </SelectItem>
                    )}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Presupuesto Máx</span>
                    <Input
                      type="number"
                      value={filters.marketValueMax}
                      onChange={(e) => update("marketValueMax", e.target.value)}
                      placeholder="Ej: 10.0 M€"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "h-[46px] lg:h-[50px] bg-[#131f15] border-white/10 rounded-xl hover:border-[#34d35a]/30 transition-all",
                        input: "text-sm font-bold text-primary placeholder:text-secondary"
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Pie hábil</span>
                    <div className="flex gap-2 h-[46px] lg:h-[50px]">
                      {[
                        { id: "D", val: "Right", label: "D" },
                        { id: "Z", val: "Left", label: "Z" },
                        { id: "Ambi", val: "Both", label: "Ambi" }
                      ].map((f) => {
                        const currentValue = filters.foot || "";
                        const selectedFeet = currentValue ? currentValue.split(",") : [];
                        const active = selectedFeet.includes(f.val);
                        
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              let newSelected = [...selectedFeet];
                              if (active) {
                                newSelected = newSelected.filter(v => v !== f.val);
                              } else {
                                newSelected.push(f.val);
                              }
                              update("foot", newSelected.join(","));
                            }}
                            className={`flex-1 rounded-xl border text-[10px] lg:text-[11px] font-black transition-all flex items-center justify-center
                                      ${active ? "bg-[#34d35a]/15 border-green text-green shadow-[0_0_15px_rgba(52,211,90,0.1)]" : "bg-[#131f15] border-white/10 text-[#7aab82] hover:border-white/20"}`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              {/* Rango de Edad & Rating */}
              <div className="space-y-5 lg:space-y-6">
                <div className="bg-[#131f15] border border-white/5 rounded-2xl p-4 lg:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase text-secondary tracking-[0.2em]">Edad del jugador</span>
                    {(filters.ageMin || filters.ageMax) && (
                      <span className="bg-[#34d35a]/15 border border-[#34d35a]/30 px-2 lg:px-3 py-1 rounded-lg text-green font-black text-[11px] lg:text-[12px]">
                        {filters.ageMin || "Mín"} — {filters.ageMax || "Máx"} años
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <input
                      type="number" value={filters.ageMin} onChange={(e) => update("ageMin", e.target.value)}
                      placeholder="Mín" className="bg-[#0e1710] border border-white/10 rounded-lg h-10 lg:h-11 text-center font-black text-primary focus:border-green outline-none"
                    />
                    <input
                      type="number" value={filters.ageMax} onChange={(e) => update("ageMax", e.target.value)}
                      placeholder="Máx" className="bg-[#0e1710] border border-white/10 rounded-lg h-10 lg:h-11 text-center font-black text-primary focus:border-green outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#131f15] border border-white/5 rounded-2xl p-4 lg:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase text-secondary tracking-[0.2em]">Rating Mín.</span>
                    <div className="text-lg lg:text-xl font-black text-green leading-none">
                      {filters.minRating || "6.0"}<span className="text-[11px] lg:text-[12px] text-[#3d6645] ml-1">/ 10</span>
                    </div>
                  </div>
                  <input
                    type="range" min="5" max="10" step="0.1"
                    value={filters.minRating}
                    onChange={(e) => update("minRating", e.target.value)}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none cursor-pointer accent-green"
                  />
                </div>

                <div className="bg-[#131f15] border border-white/5 rounded-2xl p-4 lg:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase text-secondary tracking-[0.2em]">Altura (cm)</span>
                    {(filters.heightMin || filters.heightMax) && (
                      <span className="bg-[#34d35a]/15 border border-[#34d35a]/30 px-2 lg:px-3 py-1 rounded-lg text-green font-black text-[11px] lg:text-[12px]">
                        {filters.heightMin || "Mín"} — {filters.heightMax || "Máx"} cm
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <input
                      type="number" value={filters.heightMin} onChange={(e) => update("heightMin", e.target.value)}
                      placeholder="Mín" className="bg-[#0e1710] border border-white/10 rounded-lg h-10 lg:h-11 text-center font-black text-primary focus:border-green outline-none"
                    />
                    <input
                      type="number" value={filters.heightMax} onChange={(e) => update("heightMax", e.target.value)}
                      placeholder="Máx" className="bg-[#0e1710] border border-white/10 rounded-lg h-10 lg:h-11 text-center font-black text-primary focus:border-green outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 lg:p-7 lg:px-8 border-t border-white/[0.05] bg-[#0E1710] flex gap-3 lg:gap-4 relative z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)]">
          <button
            onClick={onReset}
            className="w-1/3 h-[50px] lg:h-[58px] rounded-xl bg-[#e05a5a]/10 border border-[#e05a5a]/25 text-[#e05a5a] font-black uppercase tracking-widest text-[11px] lg:text-[13px] hover:bg-[#e05a5a]/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Limpiar
          </button>
          <button
            onClick={() => setFilterPanelOpen(false)}
            className="flex-1 h-[50px] lg:h-[58px] rounded-xl bg-green text-[#081009] font-black uppercase tracking-widest text-sm lg:text-base hover:bg-[#50e870] transition-all flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(52,211,90,0.3)]"
          >
            <CheckCircle2 size={18} />
            APLICAR
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}