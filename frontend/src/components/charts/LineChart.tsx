"use client";
import {
  LineChart as ReLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: { month: string; rating: number; ratingB?: number }[];
  nameA?: string;
  nameB?: string;
}

export default function LineChartComponent({ data, nameA = "Jugador A", nameB }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ReLineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis domain={[6, 10]} tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: "8px", fontSize: 12, color: "#f0f0f0",
          }}
          formatter={(v: number) => [v.toFixed(1), ""]}
        />
        <Line
          type="monotone" dataKey="rating" name={nameA}
          stroke="#7c6af7" strokeWidth={2} dot={{ fill: "#7c6af7", r: 2 }}
          activeDot={{ r: 4 }}
        />
        {nameB && (
          <Line
            type="monotone" dataKey="ratingB" name={nameB}
            stroke="#f0a04b" strokeWidth={2} dot={{ fill: "#f0a04b", r: 2 }}
            activeDot={{ r: 4 }}
          />
        )}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
