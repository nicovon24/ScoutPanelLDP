import { calcAgeStr } from "@/lib/utils";
import type { Player, PlayerColor, SectionDef } from "@/types";

// ── Shared color palette (compare + table) ────────────────────────────────────
export const PLAYER_COLORS: PlayerColor[] = [
  { text: "text-[#00e87a]", bg: "bg-[#00e87a]", glow: "bg-[#00e87a]/5", hex: "#00e87a" },
  { text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]", glow: "bg-[#8b5cf6]/5", hex: "#8b5cf6" },
  { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]", glow: "bg-[#f59e0b]/5", hex: "#f59e0b" },
];

// ── Rating history builder ────────────────────────────────────────────────────
export interface RatingEntry {
  month: string;
  year?: string;
  rating: number;
  injured: boolean;
}

export function buildRatingHistory(
  player: Player,
  selSeasonId: number | null,
  mode: "year" | "month",
): RatingEntry[] {
  const monthlyRaw = new Map<string, number>();
  const ratingSource = selSeasonId
    ? (player.ratings ?? []).filter((r) => r.seasonId === selSeasonId)
    : (player.ratings ?? []);
  ratingSource.forEach((r) => {
    if (r.ratingByMonth)
      Object.entries(r.ratingByMonth).forEach(([m, v]) => monthlyRaw.set(m, v));
  });

  if (mode === "year") {
    const yearlyMap: Record<string, { sum: number; count: number }> = {};
    (player.ratings ?? []).forEach((r) => {
      if (r.ratingByMonth) {
        Object.entries(r.ratingByMonth).forEach(([month, val]) => {
          const y = month.split("-")[0];
          if (!yearlyMap[y]) yearlyMap[y] = { sum: 0, count: 0 };
          yearlyMap[y].sum += val;
          yearlyMap[y].count++;
        });
      }
    });

    // A year is red when injuries cover ≥50% of its days (same logic as monthly mode).
    const yearlyInjured: Record<string, boolean> = {};
    for (const y of Object.keys(yearlyMap)) {
      const yInt    = parseInt(y);
      const yStart  = new Date(yInt, 0, 1);
      const yEnd    = new Date(yInt, 11, 31);
      const daysInYear = (yInt % 4 === 0 && (yInt % 100 !== 0 || yInt % 400 === 0)) ? 366 : 365;

      let coveredDays = 0;
      (player.injuries ?? []).forEach((inj) => {
        const injStart = new Date(inj.startedAt ?? "");
        const injEnd   = new Date(injStart);
        injEnd.setDate(injStart.getDate() + (inj.daysOut || 0));
        const overlapStart = injStart > yStart ? injStart : yStart;
        const overlapEnd   = injEnd   < yEnd   ? injEnd   : yEnd;
        if (overlapStart <= overlapEnd) {
          coveredDays += Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
        }
      });
      yearlyInjured[y] = coveredDays / daysInYear >= 0.5;
    }

    return Object.entries(yearlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([y, d]) => ({ month: y, rating: d.sum / d.count, injured: yearlyInjured[y] ?? false }));
  }

  // monthly mode
  let targetYear = 2026;
  if (selSeasonId) {
    const s = player.stats?.find((st) => st.seasonId === selSeasonId);
    const yr = s?.season?.year;
    if (yr) targetYear = yr;
  }
  const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return MONTH_LABELS.map((label, m) => {
    const key        = `${targetYear}-${(m + 1).toString().padStart(2, "0")}`;
    const daysInMonth = new Date(targetYear, m + 1, 0).getDate();
    const mStart      = new Date(targetYear, m, 1);
    const mEnd        = new Date(targetYear, m, daysInMonth);

    // A month is red only when injuries cover more than 50% of its days.
    let coveredDays = 0;
    (player.injuries ?? []).forEach((inj) => {
      const injStart = new Date(inj.startedAt ?? "");
      const injEnd   = new Date(injStart);
      injEnd.setDate(injStart.getDate() + (inj.daysOut || 0));
      const overlapStart = injStart > mStart ? injStart : mStart;
      const overlapEnd   = injEnd   < mEnd   ? injEnd   : mEnd;
      if (overlapStart <= overlapEnd) {
        coveredDays += Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
      }
    });
    const isInjured = coveredDays / daysInMonth >= 0.5;

    return { month: label, year: String(targetYear), rating: monthlyRaw.get(key) ?? 0, injured: isInjured };
  });
}

// ── Market value history builder ──────────────────────────────────────────────
export interface ValueEntry {
  month: string;
  year?: string;
  value: number;
  future?: boolean;
}

export function buildValueHistory(
  player: Player,
  selSeasonId: number | null,
  mode: "year" | "month",
): ValueEntry[] {
  if (mode === "year") {
    const allYears = Array.from(new Set([
      ...(player.stats ?? []).map((s) => s.season?.year?.toString()),
      ...(player.ratings ?? []).flatMap((r) =>
        Object.keys(r.ratingByMonth || {}).map((m) => m.split("-")[0])
      ),
    ])).filter(Boolean).sort() as string[];

    let lastVal = parseFloat(player.marketValueM ?? "0");
    return allYears.map(y => {
      const s = player.stats?.find((st) => st.season?.year?.toString() === y);
      if (s?.marketValueM) lastVal = parseFloat(s.marketValueM);
      return { month: y, value: lastVal };
    });
  }

  // monthly mode
  let targetYear = 2026;
  let targetVal  = parseFloat(player.marketValueM ?? "0");
  if (selSeasonId) {
    const s = player.stats?.find((st) => st.seasonId === selSeasonId);
    const yr = s?.season?.year;
    if (yr) targetYear = yr;
    if (s?.marketValueM) targetVal = parseFloat(s.marketValueM);
  }
  const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const today = new Date();
  return MONTH_LABELS.map((label, i) => ({
    month:  label,
    year:   String(targetYear),
    value:  targetVal + Math.sin(i) * 0.05 * targetVal,
    future: new Date(targetYear, i, 1) > today,
  }));
}

// ── Formatting helpers ────────────────────────────────────────────────────────
export function fmtNum(v: unknown, dec = 0): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return isNaN(n) ? "—" : dec > 0 ? n.toFixed(dec) : String(n);
}

export function asNum(v: unknown): number {
  const f = parseFloat(String(v ?? "0"));
  return isNaN(f) ? 0 : f;
}

// ── Section definitions ───────────────────────────────────────────────────────
export const SECTIONS: SectionDef[] = [
  {
    label: "Info General", type: "general", rows: [
      { l: "Edad",          fn: (p)    => calcAgeStr(p.dateOfBirth) },
      { l: "Valor Mercado", fn: (p)    => p.marketValueM ? `€${parseFloat(p.marketValueM).toFixed(1)}M` : "—" },
      { l: "Altura",        fn: (p)    => p.heightCm ? `${p.heightCm} cm` : "—" },
      { l: "Pie hábil",     fn: (p)    => p.preferredFoot || "—" },
      { l: "Partidos",      fn: (_, s) => fmtNum(s.matchesPlayed) },
      { l: "Minutos",       fn: (_, s) => s.minutesPlayed ? `${s.minutesPlayed}'` : "—" },
    ],
  },
  {
    label: "Ataque", type: "stat", rows: [
      { l: "Goles",           k: "goals",                                                                         max: 30,  accent: "#00E094" },
      { l: "Asistencias",     k: "assists",                                                                        max: 20,  accent: "#00E094" },
      { l: "xG",              k: "xgPerGame",  compute: (s) => asNum(s.xgPerGame)  * asNum(s.matchesPlayed), d: 1, max: 20,  accent: "#00E094" },
      { l: "Tiros / PJ",      k: "shotsPerGame",                                                          d: 2, max: 6,   accent: "#0C65D4" },
      { l: "Tiros al arco %", k: "shotsOnTargetPct",                                                      d: 1, u: "%", max: 100, accent: "#0C65D4" },
    ],
  },
  {
    label: "Pases & Creación", type: "stat", rows: [
      { l: "xA",               k: "xaPerGame",        compute: (s) => asNum(s.xaPerGame) * asNum(s.matchesPlayed), d: 1, max: 15,  accent: "#00E094" },
      { l: "Pases clave / PJ", k: "keyPassesPerGame",                                                              d: 2, max: 3,   accent: "#00E094" },
      { l: "Precisión pases %", k: "passAccuracyPct",                                                              d: 1, u: "%", max: 100, accent: "#0C65D4" },
    ],
  },
  {
    label: "Defensa", type: "stat", rows: [
      { l: "Tackles",           k: "tackles",           max: 80,  accent: "#00E094" },
      { l: "Intercepciones",    k: "interceptions",     max: 50,  accent: "#00E094" },
      { l: "Recuperaciones",    k: "recoveries",        max: 80,  accent: "#0C65D4" },
      { l: "Duelos aéreos %",   k: "aerialDuelsWonPct", d: 1, u: "%", max: 100, accent: "#7533FC" },
    ],
  },
  {
    label: "Portería", type: "stat", rows: [
      { l: "Paradas %",         k: "savePct",       d: 1, u: "%", max: 100, accent: "#E8A838" },
      { l: "Vallas invictas",   k: "cleanSheets",   max: 20, accent: "#00E094" },
      { l: "Goles recibidos",   k: "goalsConceded", max: 50, accent: "#F04444", lower: true },
    ],
  },
  {
    label: "Regates", type: "stat", rows: [
      { l: "Regates exitosos/PJ", k: "successfulDribblesPerGame", d: 2, max: 5,   accent: "#00E094" },
      { l: "Tasa de éxito %",     k: "dribbleSuccessRate",        d: 1, u: "%", max: 100, accent: "#0C65D4" },
    ],
  },
  {
    label: "Disciplina", type: "stat", rows: [
      { l: "Tarjetas amarillas", k: "yellowCards", max: 15, accent: "#E8A838", lower: true },
      { l: "Tarjetas rojas",     k: "redCards",    max: 5,  accent: "#F04444", lower: true },
    ],
  },
];

// ── Position-based section ordering ──────────────────────────────────────────
export const SECTION_ORDER: Record<string, string[]> = {
  GK:  ["Portería", "Defensa", "Pases & Creación", "Regates", "Ataque", "Disciplina"],
  DEF: ["Defensa",  "Pases & Creación", "Regates", "Ataque", "Disciplina"],
  MID: ["Pases & Creación", "Defensa", "Regates", "Ataque", "Disciplina"],
  ATT: ["Ataque", "Pases & Creación", "Regates", "Defensa", "Disciplina"],
};

export function posGroup(pos?: string): keyof typeof SECTION_ORDER {
  const p = pos?.toUpperCase() ?? "";
  if (p === "GK") return "GK";
  if (["CB", "LB", "RB"].includes(p)) return "DEF";
  if (["CAM", "CM", "CDM"].includes(p)) return "MID";
  return "ATT";
}

export function reorderSections(sections: SectionDef[], pos?: string): SectionDef[] {
  const group = posGroup(pos);
  const order = SECTION_ORDER[group];
  return [...sections].sort((a, b) => {
    const ai = order.indexOf(a.label);
    const bi = order.indexOf(b.label);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
