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
}

interface Props {
  data: DataPoint[];
  nameA?: string;
  nameB?: string;
  colorA?: string;
  colorB?: string;
}

const CustomTooltip = ({
  active, payload, label, nameA, nameB, colorA, colorB
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  nameA?: string; nameB?: string;
  colorA?: string; colorB?: string;
}) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md">
      <p className="font-black text-primary uppercase tracking-[0.1em] text-[10px] mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.name === "playerA" ? (colorA ?? "#00E094") : (colorB ?? "#7533FC") }}
            />
            <p className="text-xs font-bold" style={{ color: p.name === "playerA" ? (colorA ?? "#00E094") : (colorB ?? "#7533FC") }}>
              {p.name === "playerA" ? (nameA ?? "A") : (nameB ?? "B")}: <span className="text-primary ml-1">{p.value.toFixed(0)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function RadarChartComponent({
  data,
  nameA = "Jugador A",
  nameB,
  colorA = "#00E094", // green
  colorB = "#7533FC", // purple
}: Props) {
  const dual = nameB != null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReRadar data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <PolarGrid gridType="polygon" stroke="var(--border)" strokeWidth={1.5} />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "var(--primary)", fontSize: 11, fontWeight: 900, textAnchor: "middle" }}
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
        <Tooltip content={<CustomTooltip nameA={nameA} nameB={nameB} colorA={colorA} colorB={colorB} />} />
      </ReRadar>
    </ResponsiveContainer>
  );
}
