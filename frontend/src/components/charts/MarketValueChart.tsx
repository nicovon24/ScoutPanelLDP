"use client";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface Props {
  data: { month: string; value: number; year?: string }[];
  mode: "year" | "month";
  onChangeMode: (mode: "year" | "month") => void;
}

const formatCurrency = (val: number) => {
  return `€${val.toFixed(1)}M`;
};

export default function MarketValueChart({ data, mode, onChangeMode }: Props) {
  return (
    <div className="bg-[#1C1C1C] border border-border rounded-xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[13px] font-semibold text-primary/90 uppercase tracking-wider">
          Valor de Mercado
        </h3>

        <div className="flex bg-input/50 rounded-lg p-1 border border-border h-7">
          <button
            onClick={() => onChangeMode("year")}
            className={`px-3 flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === "year" ? "bg-card text-green shadow-sm" : "text-muted hover:text-secondary"}`}
          >
            Anual
          </button>
          <button
            onClick={() => onChangeMode("month")}
            className={`px-3 flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === "month" ? "bg-card text-green shadow-sm" : "text-muted hover:text-secondary"}`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#86C43A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#86C43A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="white" vertical={false} opacity={0.03} />
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              dy={12}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => `€${v}M`}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              cursor={{ stroke: '#86C43A', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{d.month} {d.year}</p>
                      <span className="text-lg font-black text-[#86C43A]">{formatCurrency(d.value)}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#86C43A"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
