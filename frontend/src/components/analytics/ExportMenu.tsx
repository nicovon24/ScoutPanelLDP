"use client";
import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { LeaderboardEntry, PositionGroup, LeaderboardMetric } from "@/types";
import type { ColDef } from "@/lib/analyticsConfig";
import { exportToExcel, exportToPDF } from "@/lib/analyticsExport";
import AppButton from "@/components/ui/AppButton";

interface Props {
  entries: LeaderboardEntry[];
  cols: ColDef[];
  group: PositionGroup;
  metric: LeaderboardMetric;
  seasonName: string;
  disabled?: boolean;
}

export default function ExportMenu({ entries, cols, group, metric, seasonName, disabled }: Props) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleExport(type: "excel" | "pdf") {
    setLoading(type);
    setOpen(false);
    try {
      if (type === "excel") await exportToExcel(entries, cols, group, metric, seasonName);
      else                  await exportToPDF(entries, cols, group, metric, seasonName);
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <AppButton
        type="button"
        variant="ghost"
        disableRipple
        onPress={() => setOpen((v) => !v)}
        isDisabled={disabled || loading !== null}
        className="!min-h-9 h-9 gap-2 px-3 rounded-lg border border-white/10 bg-white/[0.03]
                   text-secondary hover:text-primary hover:border-white/20 text-xs font-bold disabled:opacity-40"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Exportar
      </AppButton>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-44 bg-popover border border-white/10
                        rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <AppButton
            type="button"
            variant="light"
            disableRipple
            onPress={() => handleExport("excel")}
            className="!rounded-none w-full !min-h-0 h-auto justify-start gap-3 px-4 py-3 text-sm font-bold text-secondary
                       hover:bg-white/5 hover:text-green bg-transparent font-normal"
          >
            <FileSpreadsheet size={15} className="text-green flex-shrink-0" />
            Excel (.xlsx)
          </AppButton>
          <div className="h-px bg-white/5" />
          <AppButton
            type="button"
            variant="light"
            disableRipple
            onPress={() => handleExport("pdf")}
            className="!rounded-none w-full !min-h-0 h-auto justify-start gap-3 px-4 py-3 text-sm font-bold text-secondary
                       hover:bg-white/5 hover:text-blue-400 bg-transparent font-normal"
          >
            <FileText size={15} className="text-blue-400 flex-shrink-0" />
            PDF (.pdf)
          </AppButton>
        </div>
      )}
    </div>
  );
}
