import type { LeaderboardMetric, PositionGroup } from "@/types";

// ── Column definition for the leaderboard table ───────────────────────────────
export interface ColDef {
  key: LeaderboardMetric | "matchesPlayed";
  label: string;
  /** true = display with %, false = plain number, "float" = 2 decimal */
  format?: "pct" | "float" | "int";
  sortable: boolean;
  align?: "right";
}

// ── Position group config ─────────────────────────────────────────────────────
export interface PositionGroupConfig {
  label: string;
  positions: string[];           // API param values (empty = all)
  defaultMetric: LeaderboardMetric;
  cols: ColDef[];
}

const COLS = {
  pj:              { key: "matchesPlayed",    label: "PJ",           format: "int",   sortable: false, align: "right" } as ColDef,
  goals:           { key: "goals",            label: "Goles",        format: "int",   sortable: true,  align: "right" } as ColDef,
  assists:         { key: "assists",          label: "Asist.",       format: "int",   sortable: true,  align: "right" } as ColDef,
  combined:        { key: "combined",         label: "G+A",          format: "int",   sortable: true,  align: "right" } as ColDef,
  rating:          { key: "rating",           label: "Rating",       format: "float", sortable: true,  align: "right" } as ColDef,
  xgPerGame:       { key: "xgPerGame",        label: "xG/PJ",        format: "float", sortable: true,  align: "right" } as ColDef,
  shotsOnTarget:   { key: "shotsOnTargetPct", label: "Tiros%",       format: "pct",   sortable: true,  align: "right" } as ColDef,
  keyPasses:       { key: "keyPassesPerGame", label: "Pases clave",  format: "float", sortable: true,  align: "right" } as ColDef,
  passAcc:         { key: "passAccuracyPct",  label: "Pase%",        format: "pct",   sortable: true,  align: "right" } as ColDef,
  xaPerGame:       { key: "xaPerGame",        label: "xA/PJ",        format: "float", sortable: true,  align: "right" } as ColDef,
  recoveries:      { key: "recoveries",       label: "Recup.",       format: "int",   sortable: true,  align: "right" } as ColDef,
  tackles:         { key: "tackles",          label: "Tackles",      format: "int",   sortable: true,  align: "right" } as ColDef,
  interceptions:   { key: "interceptions",    label: "Interc.",      format: "int",   sortable: true,  align: "right" } as ColDef,
  aerialDuels:     { key: "aerialDuelsWonPct",label: "Aéreos%",      format: "pct",   sortable: true,  align: "right" } as ColDef,
  savePct:         { key: "savePct",          label: "Paradas%",     format: "pct",   sortable: true,  align: "right" } as ColDef,
  cleanSheets:     { key: "cleanSheets",      label: "V. Invictas",  format: "int",   sortable: true,  align: "right" } as ColDef,
  goalsConceded:   { key: "goalsConceded",    label: "Goles conc.",  format: "int",   sortable: true,  align: "right" } as ColDef,
};

export const POSITION_GROUPS: Record<PositionGroup, PositionGroupConfig> = {
  todos: {
    label: "Todos",
    positions: [],
    defaultMetric: "rating",
    cols: [COLS.pj, COLS.goals, COLS.assists, COLS.combined, COLS.rating],
  },
  delanteros: {
    label: "Delanteros",
    positions: ["CF", "SS", "LW", "RW"],
    defaultMetric: "goals",
    cols: [COLS.pj, COLS.goals, COLS.assists, COLS.xgPerGame, COLS.shotsOnTarget],
  },
  mediocampistas: {
    label: "Mediocampistas",
    positions: ["CM", "CAM", "CDM"],
    defaultMetric: "assists",
    cols: [COLS.pj, COLS.assists, COLS.keyPasses, COLS.xaPerGame, COLS.passAcc, COLS.recoveries],
  },
  defensores: {
    label: "Defensores",
    positions: ["CB", "LB", "RB"],
    defaultMetric: "tackles",
    cols: [COLS.pj, COLS.tackles, COLS.interceptions, COLS.recoveries, COLS.aerialDuels],
  },
  arqueros: {
    label: "Arqueros",
    positions: ["GK"],
    defaultMetric: "savePct",
    cols: [COLS.pj, COLS.savePct, COLS.cleanSheets, COLS.goalsConceded],
  },
};

export const POSITION_GROUP_KEYS = Object.keys(POSITION_GROUPS) as PositionGroup[];

/** Format a cell value according to its ColDef format */
export function formatCell(value: number | undefined | null, format?: ColDef["format"]): string {
  if (value == null || isNaN(value)) return "—";
  if (format === "pct")   return `${value.toFixed(1)}%`;
  if (format === "float") return value.toFixed(2);
  return String(Math.round(value));
}
