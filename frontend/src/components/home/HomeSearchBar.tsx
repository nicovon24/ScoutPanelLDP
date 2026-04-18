import React from "react";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear: () => void;
}

export default function HomeSearchBar({ value, onChange, placeholder = "Buscar...", onClear }: Props) {
  return (
    <div className="flex-1 flex items-center bg-red-500 border border-white/[0.05] rounded-xl
                    transition-all duration-200 focus-within:border-green/40 focus-within:shadow-[0_0_20px_rgba(0,224,148,0.1)] overflow-hidden h-12">

      {/* Icon Area */}
      <div className="pl-4 pr-3 flex items-center justify-center border-r border-white/[0.05] bg-red-500 h-full pointer-events-none">
        <Search size={16} className="text-green" />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 flex-1 px-4 h-full">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-red-500 text-[14px] text-primary placeholder:text-muted/50 outline-none h-full"
        />
        {value && (
          <button onClick={onClear} className="h-full flex items-center justify-center p-2">
            <X size={15} className="text-muted hover:text-secondary transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
