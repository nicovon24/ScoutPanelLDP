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
    <div className="bg-card-2 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-secondary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.name === "playerA" ? (colorA ?? "#00E094") : (colorB ?? "#7533FC") }}>
          {p.name === "playerA" ? (nameA ?? "A") : (nameB ?? "B")}: <strong>{p.value.toFixed(0)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function RadarChartComponent({
  data,
  nameA = "Jugador A",
  nameB,
  colorA = "#00E094",
  colorB = "#7533FC",
}: Props) {
  const dual = nameB != null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReRadar data={data} margin={{ top: 10, right: 36, bottom: 10, left: 36 }}>
        <PolarGrid gridType="polygon" stroke="#2C2C2C" strokeWidth={1} />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "#B8B8B8", fontSize: 11, fontFamily: "Inter", fontWeight: 500 }}
          tickLine={false}
        />
        <Radar
          name="playerA" dataKey="playerA"
          stroke={colorA} fill={colorA}
          fillOpacity={dual ? 0.2 : 0.25}
          strokeWidth={2} dot={{ fill: colorA, r: 3 }}
        />
        {dual && (
          <Radar
            name="playerB" dataKey="playerB"
            stroke={colorB} fill={colorB}
            fillOpacity={0.2} strokeWidth={2}
            dot={{ fill: colorB, r: 3 }}
          />
        )}
        <Tooltip content={<CustomTooltip nameA={nameA} nameB={nameB} colorA={colorA} colorB={colorB} />} />
      </ReRadar>
    </ResponsiveContainer>
  );
}
