"use client";
import { Fragment } from "react";
import { asNum, SECTIONS, reorderSections } from "@/lib/playerStats";
import type { Player, SectionDef } from "@/types";

// ── Public types ───────────────────────────────────────────────────────────────
export interface PlayerEntry {
  player: Player;
  /** Indexed by stat key — kept as Record to allow dynamic key access (r.k) */
  stat: Record<string, unknown>;
  color?: { text: string; bg: string; hex: string };
}

interface Props {
  entries: PlayerEntry[];
  /** Hide "Info General" section (for detail page) */
  showGeneralInfo?: boolean;
  /** Reorder sections so position-relevant section comes first (single player only) */
  position?: string;
  /** Split single-player view into N columns (default 1) */
  columns?: 1 | 2 | 3;
  /** Render ONLY these section labels */
  onlySections?: string[];
  /** Exclude these section labels */
  excludeSections?: string[];
}

// ── Layout constants (matching compare page) ───────────────────────────────────
const LABEL_W = 130;
const VS_W    = 44;

// ── Default colors ─────────────────────────────────────────────────────────────
const DEFAULT_COLORS = [
  { text: "text-[#00e87a]", bg: "bg-[#00e87a]", hex: "#00e87a" },
  { text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]", hex: "#8b5cf6" },
  { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]", hex: "#f59e0b" },
];


// ── Single-player sub-components ───────────────────────────────────────────────
function SingleSectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-1 mt-6 first:mt-0">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-green">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

function SingleStatRow({ label, value, pct, accent }: {
  label: string; value: string; pct: number; accent: string;
}) {
  return (
    <div className="flex items-center gap-3 py-[10px] border-b border-border/40 last:border-0">
      <span className="text-[13px] sm:text-[14px] text-secondary font-medium flex-1 min-w-0">{label}</span>
      <span className="text-[14px] sm:text-[15px] font-black text-primary w-12 sm:w-16 text-right flex-shrink-0">{value}</span>
      <div className="hidden sm:block w-[120px] flex-shrink-0 h-[5px] rounded-full bg-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(255,255,255,0.06)]"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

function SingleGeneralRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[10px] border-b border-border/40 last:border-0">
      <span className="text-[14px] text-secondary font-medium">{label}</span>
      <span className="text-[15px] font-black text-primary">{value}</span>
    </div>
  );
}

// ── Multi-player sub-components ────────────────────────────────────────────────
function MultiSectionHeader({ label, colsStyle }: { label: string; colsStyle: string }) {
  return (
    <div className="grid border-t border-border bg-surface-2" style={{ gridTemplateColumns: colsStyle }}>
      <div
        style={{ gridColumn: "1 / -1" }}
        className="px-4 py-2.5 text-[9.5px] font-black tracking-[0.16em] uppercase text-muted"
      >
        {label}
      </div>
    </div>
  );
}

function MultiStatRow({
  label, vals, nums, colors, unit = "", higherIsBetter = true, colsStyle, count,
}: {
  label: string; vals: string[]; nums: number[];
  colors: typeof DEFAULT_COLORS; unit?: string;
  higherIsBetter?: boolean; colsStyle: string; count: number;
}) {
  const maxAbs = Math.max(...nums, 0.001);
  const winVal = higherIsBetter ? Math.max(...nums) : Math.min(...nums);
  const isTie  = nums.every(n => n === nums[0]);

  return (
    <div
      className="grid border-t border-border hover:bg-white/[0.016] transition-colors"
      style={{ gridTemplateColumns: colsStyle }}
    >
      <div className="flex items-center px-4 py-2.5 border-r border-border text-[12px] font-bold text-muted">
        {label}
      </div>
      {Array.from({ length: count }).map((_, i) => {
        const v   = vals[i] ?? "—";
        const n   = nums[i] ?? 0;
        const win = !isTie && n === winVal && n !== 0;
        const C   = colors[i] ?? DEFAULT_COLORS[0];
        const pct = Math.min(100, (n / maxAbs) * 100);
        return (
          <Fragment key={i}>
            {i > 0 && <div className="border-r border-border" />}
            <div className="flex items-center gap-2 px-4 py-2.5 border-r border-border last:border-0">
              <span className={`text-[15px] font-black tracking-[-0.01em] min-w-[38px]
                ${win ? C.text : isTie ? "text-primary" : "text-primary/60"}`}>
                {v}{unit}
              </span>
              {win && <span className={`text-[9px] font-black ${C.text}`}>▲</span>}
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden max-w-[72px] ml-auto">
                <div className={`h-full rounded-full transition-all duration-500 ${C.bg}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function MultiGeneralRow({
  label, vals, colsStyle, count,
}: { label: string; vals: string[]; colsStyle: string; count: number }) {
  return (
    <div
      className="grid border-t border-border hover:bg-white/[0.016] transition-colors"
      style={{ gridTemplateColumns: colsStyle }}
    >
      <div className="flex items-center px-4 py-2.5 border-r border-border text-[12px] font-bold text-muted">
        {label}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <Fragment key={i}>
          {i > 0 && <div className="border-r border-border" />}
          <div className="flex items-center px-4 py-2.5 border-r border-border last:border-0">
            <span className="text-[14px] font-black text-primary">{vals[i] ?? "—"}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ── Single-column section renderer ────────────────────────────────────────────
function SingleSections({ sections, player, stat }: {
  sections: SectionDef[];
  player: Player;
  stat: Record<string, unknown>;
}) {
  return (
    <>
      {sections.map((sec, sIdx) => (
        <div key={sIdx}>
          <SingleSectionHeader label={sec.label} />
          {sec.type === "general"
            ? sec.rows.map((r, rIdx) => (
              <SingleGeneralRow key={rIdx} label={r.l} value={r.fn(player, stat)} />
            ))
            : sec.rows.map((r, rIdx) => {
              const raw     = r.compute ? r.compute(stat) : asNum(stat[r.k]);
              const display = raw === 0 && stat[r.k] == null ? "—"
                : (r.d != null && r.d > 0 ? raw.toFixed(r.d) : String(Math.round(raw))) + (r.u ?? "");
              const pct     = Math.min(100, (raw / r.max) * 100);
              return (
                <SingleStatRow key={rIdx} label={r.l} value={display} pct={pct} accent={r.accent} />
              );
            })
          }
        </div>
      ))}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function PlayerStatsTable({
  entries,
  showGeneralInfo = true,
  position,
  columns = 1,
  onlySections,
  excludeSections,
}: Props) {
  const isSingle = entries.length === 1;
  const count    = entries.length;
  const colors   = entries.map((e, i) => e.color ?? DEFAULT_COLORS[i] ?? DEFAULT_COLORS[0]);

  // Filter sections — onlySections / excludeSections are evaluated first so
  // explicit allowlists/blocklists from the caller always take precedence.
  const visibleSections = SECTIONS.filter(sec => {
    if (!showGeneralInfo && sec.label === "Info General") return false;
    if (onlySections) return onlySections.includes(sec.label);
    if (excludeSections) return !excludeSections.includes(sec.label);
    if (sec.label === "Portería") {
      return entries.some(e => e.player?.position?.toUpperCase() === "GK");
    }
    return true;
  });

  // ── Single player ──────────────────────────────────────────────────────────
  if (isSingle) {
    const { player, stat } = entries[0];
    const effectivePos = position ?? player?.position;

    // Reorder: position-specific section first
    const orderedSections = reorderSections(visibleSections, effectivePos);

    // 3-column layout
    if (columns === 3) {
      const total    = orderedSections.length;
      const perCol   = Math.ceil(total / 3);
      const col1     = orderedSections.slice(0, perCol);
      const col2     = orderedSections.slice(perCol, perCol * 2);
      const col3     = orderedSections.slice(perCol * 2);
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-2">
          <div><SingleSections sections={col1} player={player} stat={stat} /></div>
          <div><SingleSections sections={col2} player={player} stat={stat} /></div>
          <div><SingleSections sections={col3} player={player} stat={stat} /></div>
        </div>
      );
    }

    // 2-column layout
    if (columns === 2) {
      const half = Math.ceil(orderedSections.length / 2);
      const col1 = orderedSections.slice(0, half);
      const col2 = orderedSections.slice(half);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
          <div><SingleSections sections={col1} player={player} stat={stat} /></div>
          <div><SingleSections sections={col2} player={player} stat={stat} /></div>
        </div>
      );
    }

    // 1-column (default)
    return (
      <div>
        <SingleSections sections={orderedSections} player={player} stat={stat} />
      </div>
    );
  }

  // ── Multi player ───────────────────────────────────────────────────────────
  // minmax(140px, 1fr) gives each player column a hard floor so the parent
  // overflow-x-auto triggers a scrollbar instead of squishing columns.
  const playerColsTemplate = Array.from({ length: count })
    .map((_, i) => (i === 0 ? "minmax(140px, 1fr)" : `${VS_W}px minmax(140px, 1fr)`))
    .join(" ");
  const colsStyle = `${LABEL_W}px ${playerColsTemplate}`;

  return (
    <div>
      {visibleSections.map((sec, sIdx) => (
        <div key={sIdx}>
          <MultiSectionHeader label={sec.label} colsStyle={colsStyle} />
          {sec.type === "general"
            ? sec.rows.map((r, rIdx) => (
              <MultiGeneralRow
                key={rIdx}
                label={r.l}
                vals={entries.map(e => r.fn(e.player, e.stat))}
                colsStyle={colsStyle}
                count={count}
              />
            ))
            : sec.rows.map((r, rIdx) => (
              <MultiStatRow
                key={rIdx}
                label={r.l}
                vals={entries.map(e => {
                  const v = r.compute ? r.compute(e.stat) : asNum(e.stat[r.k]);
                  if (v === 0 && e.stat[r.k] == null) return "—";
                  return (r.d != null && r.d > 0 ? v.toFixed(r.d) : String(Math.round(v))) + (r.u ?? "");
                })}
                nums={entries.map(e => r.compute ? r.compute(e.stat) : asNum(e.stat[r.k]))}
                colors={colors}
                higherIsBetter={!r.lower}
                colsStyle={colsStyle}
                count={count}
              />
            ))
          }
        </div>
      ))}
    </div>
  );
}

// ── Export colsStyle helper for compare page heatmap/radar headers ─────────────
export function getCompareColsStyle(slotCount: number): string {
  const playerColsTemplate = Array.from({ length: slotCount })
    .map((_, i) => (i === 0 ? "minmax(140px, 1fr)" : `${VS_W}px minmax(140px, 1fr)`))
    .join(" ");
  return `${LABEL_W}px ${playerColsTemplate}`;
}
