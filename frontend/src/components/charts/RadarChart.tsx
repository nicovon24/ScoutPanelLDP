"use client";
import {
  RadarChart as ReRadar,
  Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface DataPoint {
  metric: string;
  playerA: number;
  playerB?: number;
  playerC?: number;
}

/** Same aspect as `HeatmapField` defaults (880×480) so both scale together in grids. */
const HEATMAP_W = 880;
const HEATMAP_H = 480;

interface Props {
  data: DataPoint[];
  nameA?: string;
  nameB?: string;
  nameC?: string;
  colorA?: string;
  colorB?: string;
  colorC?: string;
  /** Max width in px (default 880, same cap as heatmap detail view). */
  maxWidth?: number;
  className?: string;
}

const CustomTooltip = ({
  active, payload, label, nameA, nameB, nameC, colorA, colorB, colorC
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  nameA?: string; nameB?: string; nameC?: string;
  colorA?: string; colorB?: string; colorC?: string;
}) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md">
      <p className="font-black text-primary uppercase tracking-[0.1em] text-[10px] mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => {
          let c = colorA ?? "#00E094";
          let n = nameA ?? "A";
          if (p.name === "playerB") { c = colorB ?? "#7533FC"; n = nameB ?? "B"; }
          if (p.name === "playerC") { c = colorC ?? "#f59e0b"; n = nameC ?? "C"; }

          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              <p className="text-xs font-bold" style={{ color: c }}>
                {n}: <span className="text-primary ml-1">{p.value.toFixed(0)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function RadarChartComponent({
  data,
  nameA = "Jugador A",
  nameB,
  nameC,
  colorA = "#00e87a", // green
  colorB = "#8b5cf6", // purple
  colorC = "#f59e0b", // amber
  maxWidth = HEATMAP_W,
  className = "",
}: Props) {
  const dual = nameB != null;

  return (
    <div className={`w-full mx-auto ${className}`} style={{ maxWidth }}>
      {/* Match `HeatmapField` inner padding so paired cards align visually */}
      <div className="p-2 sm:p-4">
        <div
          className="relative w-full min-h-[200px]"
          style={{ aspectRatio: `${HEATMAP_W} / ${HEATMAP_H}` }}
        >
          <ResponsiveContainer width="100%" height="100%" debounce={32}>
            <ReRadar data={data} margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
              <PolarGrid gridType="polygon" stroke="var(--border)" strokeWidth={1.5} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "var(--primary)", fontSize: 12, fontWeight: 900, textAnchor: "middle" }}
                tickLine={false}
                axisLine={false}
              />
              <Radar
                name="playerA" dataKey="playerA"
                stroke={colorA} fill={colorA}
                fillOpacity={dual ? 0.35 : 0.45}
                strokeWidth={3} dot={{ fill: colorA, r: 4, strokeWidth: 2, stroke: "#000" }}
              />
              {dual && (
                <Radar
                  name="playerB" dataKey="playerB"
                  stroke={colorB} fill={colorB}
                  fillOpacity={0.35} strokeWidth={3}
                  dot={{ fill: colorB, r: 4, strokeWidth: 2, stroke: "#000" }}
                />
              )}
              {nameC != null && (
                <Radar
                  name="playerC" dataKey="playerC"
                  stroke={colorC} fill={colorC}
                  fillOpacity={0.35} strokeWidth={3}
                  dot={{ fill: colorC, r: 4, strokeWidth: 2, stroke: "#000" }}
                />
              )}
              <Tooltip content={<CustomTooltip nameA={nameA} nameB={nameB} nameC={nameC} colorA={colorA} colorB={colorB} colorC={colorC} />} />
            </ReRadar>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
