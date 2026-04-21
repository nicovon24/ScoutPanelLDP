import { describe, it, expect } from "vitest";
import { buildSingleRadar, buildMultiRadar, RADAR_METRICS } from "@/lib/radarNorm";

const STAT_HIGH: Record<string, unknown> = {
  goals: 30,
  assists: 15,
  xgPerGame: 0.8,
  xaPerGame: 0.5,
  matchesPlayed: 38,
  keyPassesPerGame: 3.5,
  passAccuracyPct: 90,
  dribbleSuccessRate: 75,
  tackles: 80,
  interceptions: 60,
  recoveries: 150,
  aerialDuelsWonPct: 65,
  sofascoreRating: 8.5,
};

const STAT_ZERO: Record<string, unknown> = {};

// ── buildSingleRadar ──────────────────────────────────────────────────────────

describe("buildSingleRadar", () => {
  it("devuelve la misma cantidad de métricas que RADAR_METRICS", () => {
    const result = buildSingleRadar(STAT_HIGH);
    expect(result).toHaveLength(RADAR_METRICS.length);
  });

  it("cada entrada tiene 'metric' y 'playerA'", () => {
    const result = buildSingleRadar(STAT_HIGH);
    result.forEach((row) => {
      expect(typeof row.metric).toBe("string");
      expect(typeof row.playerA).toBe("number");
    });
  });

  it("los valores están acotados entre 0 y 100", () => {
    const result = buildSingleRadar(STAT_HIGH);
    result.forEach((row) => {
      expect(row.playerA).toBeGreaterThanOrEqual(0);
      expect(row.playerA).toBeLessThanOrEqual(100);
    });
  });

  it("stats vacías → todos 0", () => {
    const result = buildSingleRadar(STAT_ZERO);
    result.forEach((row) => {
      expect(row.playerA).toBe(0);
    });
  });

  it("stat null → todos 0 (no lanza)", () => {
    expect(() => buildSingleRadar(null)).not.toThrow();
    const result = buildSingleRadar(null);
    result.forEach((row) => expect(row.playerA).toBe(0));
  });

  it("stat undefined → todos 0 (no lanza)", () => {
    expect(() => buildSingleRadar(undefined)).not.toThrow();
  });

  it("jugador con stats altas supera a jugador con stats cero", () => {
    const high = buildSingleRadar(STAT_HIGH);
    const zero = buildSingleRadar(STAT_ZERO);
    const totalHigh = high.reduce((acc, r) => acc + r.playerA, 0);
    const totalZero = zero.reduce((acc, r) => acc + r.playerA, 0);
    expect(totalHigh).toBeGreaterThan(totalZero);
  });
});

// ── buildMultiRadar ───────────────────────────────────────────────────────────

describe("buildMultiRadar", () => {
  const statB: Record<string, unknown> = { ...STAT_HIGH, goals: 10, sofascoreRating: 7 };

  it("sin playerC no incluye la key 'playerC'", () => {
    const result = buildMultiRadar(STAT_HIGH, statB);
    result.forEach((row) => {
      expect("playerC" in row).toBe(false);
    });
  });

  it("con playerC incluye la key 'playerC'", () => {
    const result = buildMultiRadar(STAT_HIGH, statB, STAT_ZERO);
    result.forEach((row) => {
      expect("playerC" in row).toBe(true);
    });
  });

  it("devuelve la misma cantidad de métricas que RADAR_METRICS", () => {
    const result = buildMultiRadar(STAT_HIGH, statB);
    expect(result).toHaveLength(RADAR_METRICS.length);
  });

  it("playerA y playerB pueden diferir", () => {
    const result = buildMultiRadar(STAT_HIGH, statB);
    const goalsRow = result.find((r) => r.metric === "Goles")!;
    expect(goalsRow.playerA).toBeGreaterThan(goalsRow.playerB);
  });

  it("valores de playerB acotados entre 0 y 100", () => {
    const result = buildMultiRadar(STAT_HIGH, statB);
    result.forEach((row) => {
      expect(row.playerB).toBeGreaterThanOrEqual(0);
      expect(row.playerB).toBeLessThanOrEqual(100);
    });
  });
});
