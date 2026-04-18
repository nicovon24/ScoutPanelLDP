"use client";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface Props {
  data: { month: string; rating: number; injured?: boolean; injuryName?: string; year?: string }[];
  nameA?: string;
}

const getColor = (val: number) => {
  if (val <= 0) return "transparent";
  if (val >= 7.5) return "#00E094"; 
  if (val >= 7.0) return "#86C43A"; 
  if (val >= 6.5) return "#D4A017"; 
  if (val >= 6.0) return "#F47B20"; 
  return "#FF4D4D"; 
};

interface Props {
  data: any[];
  nameA: string;
  mode: "year" | "month";
  onChangeMode: (mode: "year" | "month") => void;
}

const getBarColor = (rating: number) => {
  if (rating >= 8) return "#00E094"; 
  if (rating >= 7) return "#0C65D4"; 
  if (rating >= 6) return "#E8A838"; 
  return "#FF4D4D"; 
};

export default function EvolutionBarChart({ data, nameA, mode, onChangeMode }: Props) {
  return (
    <div className="bg-[#1C1C1C] border border-border rounded-xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[13px] font-semibold text-primary/90 uppercase tracking-wider">
          Resumen Evolutivo
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

      <div className="flex-1 flex gap-6 items-start">
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -45, bottom: 25 }}>
              <CartesianGrid strokeDasharray="0" stroke="white" vertical={false} opacity={0.03} />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                dy={12}
              />
              <YAxis
                domain={[0, 9]}
                tickLine={false}
                axisLine={false}
                hide
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    if (d.rating <= 0 && !d.injured) return null;
                    return (
                      <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{d.month} {d.year}</p>
                        <div className="flex items-center gap-2">
                          {d.rating > 0 ? (
                            <span className="text-lg font-black" style={{ color: getColor(d.rating) }}>{d.rating.toFixed(1)}</span>
                          ) : (
                            <span className="text-lg font-black text-muted">—</span>
                          )}
                          {d.injured && <span className="bg-danger/20 text-danger text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Lesión</span>}
                        </div>
                        {d.injured && d.injuryName && (
                          <p className="text-[10px] text-danger font-medium mt-1 leading-tight max-w-[120px]">{d.injuryName}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="rating" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.rating)} />
                ))}
              </Bar>

              <XAxis
                dataKey="rating"
                axisLine={false}
                tickLine={false}
                interval={0}
                xAxisId="values"
                tick={({ x, y, payload, index }: any) => {
                  const val = data[index]?.rating;
                  const display = val > 0 ? val.toFixed(1) : "—";
                  const color = val > 0 ? getColor(val) : "rgba(255,255,255,0.2)";
                  
                  return (
                    <text 
                      x={x} 
                      y={y + 18} 
                      fill={color} 
                      textAnchor="middle" 
                      style={{ fontSize: '12px', fontWeight: '900' }}
                    >
                      {display}
                    </text>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical Scale Legend */}
        <div className="flex flex-col justify-between h-full py-12 pr-2 shrink-0 border-l border-white/5 pl-4">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-black text-[#00E0E0]">8</span>
            <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#00E0E0] to-[#00E094]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-black text-[#00E094]">7</span>
            <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#00E094] to-[#D4A017]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-black text-[#D4A017]">6</span>
            <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#D4A017] to-[#FF4D4D]" />
          </div>
        </div>
      </div>
    </div>
  );
}
