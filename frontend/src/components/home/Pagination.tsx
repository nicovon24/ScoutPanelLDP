"use client";
import React from "react";
import { Pagination as NextUIPagination } from "@nextui-org/react";

interface Props {
  current: number;
  total: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ current, total, onPageChange }: Props) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <NextUIPagination
        showControls
        total={total}
        page={current}
        onChange={onPageChange}
        classNames={{
          wrapper: "gap-2",
          item: "w-10 h-10 text-[14px] font-bold text-muted hover:text-primary transition-all bg-transparent [&[data-hover=true]]:bg-white/5",
          cursor: "w-10 h-10 text-[14px] font-bold bg-green text-base shadow-[0_4px_15px_rgba(0,224,148,0.2)]",
          prev: "w-10 h-10 text-muted bg-transparent hover:text-primary [&[data-hover=true]]:bg-white/5",
          next: "w-10 h-10 text-muted bg-transparent hover:text-primary [&[data-hover=true]]:bg-white/5"
        }}
      />
    </div>
  );
}
