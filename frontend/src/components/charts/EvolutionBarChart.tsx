"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: string;
  year?: string;
  rating: number;
  injured?: boolean;
  injuryName?: string;
}

interface Props {
  data: DataPoint[];
  nameA: string;
  mode: "year" | "month";
  onChangeMode: (mode: "year" | "month") => void;
}

const getRatingColor = (val: number): string => {
  if (val >= 7.5) return "#00E094";
  if (val >= 7.0) return "#86C43A";
  if (val >= 6.5) return "#D4A017";
  if (val >= 6.0) return "#F47B20";
  return "#FF4D4D";
};

const CustomBarShape = (props: any) => {
  const { x, y, width, height, background, rating, injured } = props;
  const cx = x + width / 2;
  const bgY = (background?.y ?? 0) + (background?.height ?? 120);

  if (injured) {
    const bH = Math.max(height || 0, 24);
    const bY = bgY - bH;
    return (
      <g>
        <rect x={x} y={bY} width={width} height={bH} fill="rgba(255,77,77,0.18)" rx={4} />
        <circle cx={cx} cy={bY - 17} r={11} fill="#FF4D4D" fillOpacity={0.9} />
        <text x={cx} y={bY - 12} textAnchor="middle" fill="white" fontSize={14} fontWeight="900">+</text>
      </g>
    );
  }

  if (!rating || rating <= 0) {
    return (
      <rect
        x={x + 2}
        y={bgY - 5}
        width={Math.max(width - 4, 4)}
        height={5}
        fill="rgba(255,255,255,0.06)"
        rx={3}
      />
    );
  }

  const fill = getRatingColor(rating);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
      <text
        x={cx}
        y={y - 6}
        textAnchor="middle"
        fill={fill}
        fontSize={11}
        fontWeight="900"
      >
        {rating.toFixed(1)}
      </text>
    </g>
  );
};

const CustomMonthTick = ({ x, y, payload, data }: any) => {
  const entry = (data as DataPoint[])?.find(d => d.month === payload.value);
  let fill = "rgba(255,255,255,0.4)";
  let fontWeight = 700;

  if (entry?.injured) {
    fill = "#FF6B6B";
    fontWeight = 900;
  } else if (!entry || entry.rating <= 0) {
    fill = "rgba(255,255,255,0.18)";
  }

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill={fill} fontSize={11} fontWeight={fontWeight}>
      {payload.value}
    </text>
  );
};

export default function EvolutionBarChart({ data, nameA: _nameA, mode, onChangeMode }: Props) {
  const chartData = data.map(d => ({
    ...d,
    trend: d.rating > 0 && !d.injured ? d.rating : null,
  }));

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
            <ComposedChart data={chartData} margin={{ top: 30, right: 0, left: -45, bottom: 25 }}>
              <CartesianGrid strokeDasharray="0" stroke="white" vertical={false} opacity={0.03} />
              <XAxis
                dataKey="month"
                tick={(props) => <CustomMonthTick {...props} data={data} />}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 9]}
                tickLine={false}
                axisLine={false}
                hide
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as DataPoint;
                  if (d.rating <= 0 && !d.injured) return null;
                  return (
                    <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">
                        {d.month} {d.year}
                      </p>
                      <div className="flex items-center gap-2">
                        {d.rating > 0 ? (
                          <span className="text-lg font-black" style={{ color: getRatingColor(d.rating) }}>
                            {d.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-lg font-black text-muted">—</span>
                        )}
                        {d.injured && (
                          <span className="bg-danger/20 text-danger text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            Lesión
                          </span>
                        )}
                      </div>
                      {d.injured && d.injuryName && (
                        <p className="text-[10px] text-danger font-medium mt-1 leading-tight max-w-[130px]">
                          {d.injuryName}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="rating"
                barSize={20}
                shape={(props: any) => <CustomBarShape {...props} />}
              />
              <Line
                dataKey="trend"
                type="monotone"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
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
