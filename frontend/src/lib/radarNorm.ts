// ─── Radar chart normalization ────────────────────────────────────────────────
// Single source of truth for metrics, stat keys, and scale factors.
// Scale converts raw stat values to a 0-100 range for the radar chart.

export interface RadarMetric {
  metric: string;
  key: string;
  /** Multiplier applied before clamping to 100 */
  scale: number;
}

export const RADAR_METRICS: RadarMetric[] = [
  { metric: "Goles",       key: "goals",             scale: 5    },
  { metric: "xG/PJ",       key: "xgPerGame",         scale: 100  },
  { metric: "Asistencias", key: "assists",            scale: 8    },
  { metric: "xA/PJ",       key: "xaPerGame",         scale: 100  },
  { metric: "Pases clave", key: "keyPassesPerGame",   scale: 35   },
  { metric: "Pases%",      key: "passAccuracyPct",    scale: 1    },
  { metric: "Regates%",    key: "dribbleSuccessRate", scale: 1    },
  { metric: "Tackles",     key: "tackles",            scale: 1.5  },
  { metric: "Intercep.",   key: "interceptions",      scale: 2    },
  { metric: "Recuper.",    key: "recoveries",         scale: 0.8  },
  { metric: "Aéreos%",     key: "aerialDuelsWonPct",  scale: 1    },
  { metric: "Rating",      key: "sofascoreRating",    scale: 11   },
];

function norm(stat: Record<string, unknown> | null | undefined, key: string, scale: number): number {
  const raw = parseFloat(String(stat?.[key] ?? "0"));
  return Math.min(100, (isNaN(raw) ? 0 : raw) * scale);
}

/**
 * Builds radar data for a single player (key "playerA").
 */
export function buildSingleRadar(
  stat: Record<string, unknown> | null | undefined
): Array<{ metric: string; playerA: number }> {
  return RADAR_METRICS.map(({ metric, key, scale }) => ({
    metric,
    playerA: norm(stat, key, scale),
  }));
}

/**
 * Builds radar data for up to 3 players (keys playerA / playerB / playerC).
 * Pass undefined for slots that are not in use.
 */
export function buildMultiRadar(
  statA: Record<string, unknown> | null | undefined,
  statB: Record<string, unknown> | null | undefined,
  statC?: Record<string, unknown> | null | undefined
): Array<{ metric: string; playerA: number; playerB: number; playerC?: number }> {
  return RADAR_METRICS.map(({ metric, key, scale }) => ({
    metric,
    playerA: norm(statA, key, scale),
    playerB: norm(statB, key, scale),
    ...(statC !== undefined ? { playerC: norm(statC, key, scale) } : {}),
  }));
}
