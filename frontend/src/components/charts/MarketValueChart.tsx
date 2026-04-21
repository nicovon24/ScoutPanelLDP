"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface DataPoint {
  month: string;
  value: number;
  year?: string;
  future?: boolean;
}

interface Props {
  data: DataPoint[];
  mode: "year" | "month";
  onChangeMode: (mode: "year" | "month") => void;
}

interface TickProps { x: string | number; y: string | number; payload: { value: string }; index: number }
interface DotProps  { cx?: number; cy?: number; index: number }

const formatCurrency = (val: number) => `€${val.toFixed(1)}M`;

export default function MarketValueChart({ data, mode, onChangeMode }: Props) {
  // Solo meses con dato real: sin tramo proyectado después del último valor
  const displayData = data.some(d => d.future)
    ? data.filter((d) => !d.future)
    : data;

  const peak = Math.max(...displayData.map((d) => d.value), 0);
  const dataWithPeak = displayData.map((d) => ({ ...d, peakLine: peak }));

  // Toda la serie visible es “pasado”: línea y relleno verdes uniformes
  const transitionPct = 100;

  // “Hoy” en el último mes con dato (si había meses futuros en la fuente, ya los quitamos)
  const lastPastMonth =
    displayData.length > 0 ? displayData[displayData.length - 1]?.month : undefined;

  return (
    <div className="bg-[#1C1C1C] border border-border rounded-xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[13px] font-semibold text-primary/90 uppercase tracking-wider">
            Valor de Mercado
          </h3>
          <p className="text-[11px] text-muted mt-0.5">
            Pico:{" "}
            <span className="text-yellow-400 font-black">{formatCurrency(peak)}</span>
          </p>
        </div>
        <div className="flex bg-input/50 rounded-lg p-1 border border-border h-7">
          <button
            onClick={() => onChangeMode("year")}
            className={`px-3 flex items-center justify-center rounded-md text-2xs font-black uppercase tracking-widest transition-all ${mode === "year" ? "bg-card text-green shadow-sm" : "text-muted hover:text-secondary"}`}
          >
            Anual
          </button>
          <button
            onClick={() => onChangeMode("month")}
            className={`px-3 flex items-center justify-center rounded-md text-2xs font-black uppercase tracking-widest transition-all ${mode === "month" ? "bg-card text-green shadow-sm" : "text-muted hover:text-secondary"}`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWithPeak} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
            <defs>
              {/* Stroke gradient: solid past → dim future */}
              <linearGradient id="strokeGradientMV" x1="0" y1="0" x2="1" y2="0">
                <stop offset={`${transitionPct}%`} stopColor="#00E094" stopOpacity={1} />
                <stop offset={`${transitionPct}%`} stopColor="#00E094" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00E094" stopOpacity={0.25} />
              </linearGradient>
              {/* Fill gradient: vertical fade */}
              <linearGradient id="fillGradientMV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E094" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#00E094" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" stroke="white" vertical={false} opacity={0.03} />

            <XAxis
              dataKey="month"
              tick={({ x, y, payload, index }: TickProps) => {
                const entry = displayData[index];
                const fill = entry?.future
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.4)";
                return (
                  <text x={x} y={Number(y) + 14} textAnchor="middle" fill={fill} fontSize={11} fontWeight={700}>
                    {payload.value}
                  </text>
                );
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700 }}
              tickFormatter={v => `€${v}M`}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />

            <Tooltip
              cursor={{ stroke: "rgba(0,224,148,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as DataPoint;
                return (
                  <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-2xs font-black text-muted uppercase tracking-widest mb-1">
                      {d.month} {d.year}
                    </p>
                    <span className="text-lg font-black text-[#00E094]">
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                );
              }}
            />


            {/* "Hoy" vertical marker */}
            {lastPastMonth && (
              <ReferenceLine
                x={lastPastMonth}
                stroke="rgba(0,224,148,0.18)"
                strokeDasharray="3 3"
                label={{
                  value: "Hoy",
                  position: "insideTopRight",
                  fill: "rgba(0,224,148,0.5)",
                  fontSize: 9,
                  fontWeight: 900,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#strokeGradientMV)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#fillGradientMV)"
              animationDuration={1500}
              dot={({ cx, cy, index }: DotProps) => {
                const entry = displayData[index];
                if (!entry) return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
                if (entry.future) {
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="transparent"
                      stroke="#00E094"
                      strokeWidth={1.5}
                      opacity={0.3}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#00E094"
                    opacity={0.8}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
