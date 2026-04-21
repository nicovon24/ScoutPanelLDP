export const sharedSelectClasses = {
  trigger: "bg-card border border-white/10 rounded-xl hover:border-[#34d35a]/30 data-[hover=true]:bg-white/[0.03] transition-all shadow-sm",
  value: "text-secondary font-bold text-sm sm:text-base",
  popoverContent: "bg-popover border border-white/10 shadow-2xl rounded-xl",
};

/** NextUI `Input`: etiqueta arriba, campo compacto, padding izquierdo en el recuadro. */
export const authInputClassNames = {
  base: "w-full gap-4 data-[has-label=true]:gap-4",
  label:
    "text-xs font-semibold text-muted uppercase tracking-[1.5px] !text-muted mb-0 pb-2 leading-snug",
  inputWrapper:
    "h-12 min-h-12 bg-input border border-border rounded-xl shadow-none py-0 pl-3.5 pr-2 group-data-[focus=true]:border-green transition-colors",
  input: "text-sm sm:text-[15px] text-primary placeholder:text-muted pl-0.5",
};

/** Búsqueda en dashboard (NextUI `Input` con etiqueta arriba). */
export const searchFieldInputClassNames = {
  base: "w-full gap-4 data-[has-label=true]:gap-4",
  label:
    "text-[11px] font-black uppercase tracking-[0.14em] text-muted pb-2 leading-none",
  inputWrapper:
    "h-12 min-h-12 bg-transparent border-none shadow-none rounded-none pl-2 pr-1 group-data-[focus=true]:bg-transparent",
  input: "text-sm sm:text-base text-primary placeholder:text-secondary pl-1",
};

export const sharedSelectItemClasses = {
  base: [
    "text-[#7aab82]",
    "data-[hover=true]:bg-white/5",
    "data-[hover=true]:text-green",
    "data-[selected=true]:text-green",
    "data-[selected=true]:bg-green/10",
    "transition-all",
    "font-bold",
    "text-sm",
  ].join(" "),
  title: "font-black uppercase tracking-tight",
};

/** Etiqueta encima de bloques custom (SearchBar con secciones apiladas). */
export const searchBarLabelClass =
  "block text-[11px] font-black uppercase tracking-[0.14em] text-muted pb-2.5";
