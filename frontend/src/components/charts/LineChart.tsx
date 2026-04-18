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
    <ResponsiveContainer width="100%" height={220}>
      <ReLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--primary)", fontSize: 10, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "var(--primary)", fontSize: 10, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(28, 28, 28, 0.8)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
            color: "var(--primary)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
          }}
          itemStyle={{ fontWeight: "bold" }}
          formatter={(value: any) => [Number(value).toFixed(2), "Rating"]}
        />
        <Line
          type="monotone"
          dataKey="rating"
          name={nameA}
          stroke="var(--green)"
          strokeWidth={3}
          dot={{ fill: "var(--green)", r: 4, strokeWidth: 2, stroke: "#000" }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        {nameB && (
          <Line
            type="monotone"
            dataKey="ratingB"
            name={nameB}
            stroke="var(--purple)"
            strokeWidth={3}
            dot={{ fill: "var(--purple)", r: 4, strokeWidth: 2, stroke: "#000" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        )}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
