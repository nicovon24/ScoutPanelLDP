export const sharedSelectClasses = {
  trigger: "bg-card border border-white/10 rounded-xl hover:border-[#34d35a]/30 data-[hover=true]:bg-white/[0.03] transition-all shadow-sm",
  value: "text-secondary font-bold text-sm sm:text-base",
  popoverContent: "bg-popover border border-white/10 shadow-2xl rounded-xl",
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
    "text-sm"
  ].join(" "),
  title: "font-black uppercase tracking-tight",
};
