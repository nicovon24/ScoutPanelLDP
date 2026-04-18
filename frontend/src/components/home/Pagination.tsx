"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  current: number;
  total: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ current, total, onPageChange }: Props) {
  if (total <= 1) return null;

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
        className="w-10 h-10 rounded-xl border border-white/[0.05] flex items-center justify-center text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-1.5 px-2">
        {pages.map((p) => {
          const active = p === current;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 rounded-xl text-[14px] font-bold transition-all
                          ${active 
                            ? "bg-green text-base shadow-[0_4px_15px_rgba(0,224,148,0.2)]" 
                            : "text-muted hover:text-primary hover:bg-white/5 border border-transparent hover:border-white/5"}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        disabled={current === total}
        onClick={() => onPageChange(current + 1)}
        className="w-10 h-10 rounded-xl border border-white/[0.05] flex items-center justify-center text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
