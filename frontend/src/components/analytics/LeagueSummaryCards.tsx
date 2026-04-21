"use client";
import { Target, Zap, TrendingUp, Users } from "lucide-react";
import type { LeagueSummary } from "@/types";

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}

function SummaryCard({ icon, label, value, sub, accent }: CardProps) {
  return (
    <div className="card flex items-center gap-4 py-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xs font-black uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="text-xl font-black text-primary leading-tight">{value}</p>
        {sub && <p className="text-xs text-secondary font-medium">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  summary: LeagueSummary;
  loading?: boolean;
}

export default function LeagueSummaryCards({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`card h-[76px] animate-pulse bg-white/[0.02] ${i < 2 ? "hidden sm:block" : ""}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="hidden sm:block">
        <SummaryCard
          icon={<Target size={18} />}
          label="Total goles"
          value={summary.totalGoals}
          accent="bg-green/10 text-green"
        />
      </div>
      <div className="hidden sm:block">
        <SummaryCard
          icon={<Zap size={18} />}
          label="Total asistencias"
          value={summary.totalAssists}
          accent="bg-blue/10 text-blue-400"
        />
      </div>
      <SummaryCard
        icon={<TrendingUp size={18} />}
        label="Rating promedio"
        value={summary.avgRating.toFixed(1)}
        accent="bg-gold/10 text-gold"
      />
      <SummaryCard
        icon={<Users size={18} />}
        label="Jugadores activos"
        value={summary.activePlayers}
        accent="bg-purple/10 text-purple-400"
      />
    </div>
  );
}
