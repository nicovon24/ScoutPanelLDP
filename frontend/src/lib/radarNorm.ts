// ─── Radar chart normalization ────────────────────────────────────────────────
// Single source of truth for metrics, stat keys, and scale factors.
// Scale converts raw stat values to a 0-100 range for the radar chart.

import type { PlayerStat } from "@/types";

/** Stats row from API (typed) or a loose bag for dynamic key reads */
type StatInput = PlayerStat | Record<string, unknown> | null | undefined;

function asStatBag(stat: StatInput): Record<string, unknown> {
  if (stat == null) return {};
  return stat as Record<string, unknown>;
}

export interface RadarMetric {
  metric: string;
  key: string;
  /** Multiplier applied before clamping to 100 */
  scale: number;
  /** Optional: derive value from the full stat object instead of stat[key] */
  compute?: (stat: Record<string, unknown>) => number;
}

function _n(stat: StatInput, key: string): number {
  const raw = parseFloat(String(asStatBag(stat)[key] ?? "0"));
  return isNaN(raw) ? 0 : raw;
}

export const RADAR_METRICS: RadarMetric[] = [
  { metric: "Goles",       key: "goals",             scale: 5   },
  {
    metric: "xG",          key: "xgPerGame",          scale: 5,
    compute: (s) => _n(s, "xgPerGame") * _n(s, "matchesPlayed"),
  },
  { metric: "Asistencias", key: "assists",            scale: 8   },
  {
    metric: "xA",          key: "xaPerGame",          scale: 8,
    compute: (s) => _n(s, "xaPerGame") * _n(s, "matchesPlayed"),
  },
  { metric: "Pases clave", key: "keyPassesPerGame",   scale: 35  },
  { metric: "Pases%",      key: "passAccuracyPct",    scale: 1   },
  { metric: "Regates%",    key: "dribbleSuccessRate", scale: 1   },
  { metric: "Tackles",     key: "tackles",            scale: 1.5 },
  { metric: "Intercep.",   key: "interceptions",      scale: 2   },
  { metric: "Recuper.",    key: "recoveries",         scale: 0.8 },
  { metric: "Aéreos%",     key: "aerialDuelsWonPct",  scale: 1   },
  { metric: "Rating",      key: "sofascoreRating",    scale: 11  },
];

function norm(stat: StatInput, m: RadarMetric): number {
  const bag = asStatBag(stat);
  const raw = m.compute ? m.compute(bag) : _n(stat, m.key);
  return Math.min(100, raw * m.scale);
}

/**
 * Builds radar data for a single player (key "playerA").
 */
export function buildSingleRadar(
  stat: StatInput
): Array<{ metric: string; playerA: number }> {
  return RADAR_METRICS.map((m) => ({
    metric:  m.metric,
    playerA: norm(stat, m),
  }));
}

/**
 * Builds radar data for up to 3 players (keys playerA / playerB / playerC).
 * Pass undefined for slots that are not in use.
 */
export function buildMultiRadar(
  statA: StatInput,
  statB: StatInput,
  statC?: StatInput
): Array<{ metric: string; playerA: number; playerB: number; playerC?: number }> {
  return RADAR_METRICS.map((m) => ({
    metric:  m.metric,
    playerA: norm(statA, m),
    playerB: norm(statB, m),
    ...(statC !== undefined ? { playerC: norm(statC, m) } : {}),
  }));
}
