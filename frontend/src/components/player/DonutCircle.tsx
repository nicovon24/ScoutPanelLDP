interface Props {
  value: number;
  label: string;
  color?: string;
}

export default function DonutCircle({ value, label, color = "#00E094" }: Props) {
  const r    = 40;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[100px] h-[100px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-primary">
          {pct.toFixed(0)}%
        </span>
      </div>
      <span className="text-2xs text-secondary text-center font-bold uppercase tracking-widest leading-tight max-w-[90px]">
        {label}
      </span>
    </div>
  );
}
