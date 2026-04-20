// ─── Shared domain types ──────────────────────────────────────────────────────

export interface Team {
  id?: number;
  name: string;
  logoUrl?: string | null;
  country?: string;
}

export interface Season {
  id: number;
  year: number;
  name: string;
}

export interface PlayerStat {
  id?: number;
  seasonId?: number;
  matchesPlayed?: number;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  shotsPerGame?: string | number;
  shotsOnTargetPct?: string | number;
  xgPerGame?: string | number;
  xaPerGame?: string | number;
  passAccuracyPct?: string | number;
  keyPassesPerGame?: string | number;
  successfulDribblesPerGame?: string | number;
  dribbleSuccessRate?: string | number;
  tackles?: number;
  interceptions?: number;
  recoveries?: number;
  aerialDuelsWonPct?: string | number;
  sofascoreRating?: string | number;
  marketValueM?: string;
  savePct?: string | number;
  cleanSheets?: number;
  goalsConceded?: number;
  yellowCards?: number;
  redCards?: number;
  heatmapData?: number[][];
  season?: Season;
}

export interface CareerEntry {
  id: number;
  teamName: string;
  teamLogoUrl?: string | null;
  yearRange: string;
  appearances: number;
  goals: number;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  nationality?: string;
  dateOfBirth?: string;
  /** height_cm */
  heightCm?: number;
  /** weight_kg */
  weightKg?: number;
  /** preferred_foot */
  preferredFoot?: string;
  photoUrl?: string;
  marketValueM?: string;
  contractType?: string;
  /** contract_until */
  contractUntil?: string;
  debutYear?: number;
  team?: Team;
  stats?: PlayerStat[];
  ratings?: Array<{ seasonId?: number; ratingByMonth?: Record<string, number> }>;
  injuries?: Array<{ id?: number; injuryType?: string; startedAt?: string; daysOut?: number }>;
  /** career (player_career table) */
  career?: CareerEntry[];
  strengths?: string[];
  weaknesses?: string[];
  scoutingNote?: string;
}

/** Resultado compacto del endpoint de búsqueda */
export interface SearchHit {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  nationality?: string;
  marketValueM?: string;
}

/** Jugador en el store de favoritos / shortlist */
export interface ShortlistPlayer {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  marketValueM?: string;
  nationality?: string;
  team?: Team;
}

export interface SearchFilters {
  q: string;
  position: string;
  teamId: string;
  ageMin: string;
  ageMax: string;
  minRating: string;
  marketValueMin: string;
  marketValueMax: string;
  nationality: string;
  contractType: string;
  sortBy: string;
}

/** Color palette para comparaciones y radar */
export interface PlayerColor {
  text: string;
  bg: string;
  glow?: string;
  hex: string;
}

// ── Stats table section definition types ──────────────────────────────────────
export type StatDef = {
  l: string;
  k: string;
  /** Optional override: derive value from the full stat object instead of stat[k] */
  compute?: (stat: Record<string, unknown>) => number;
  d?: number;
  u?: string;
  lower?: boolean;
  max: number;
  accent: string;
};

export type GeneralDef = { l: string; fn: (player: Player, stat: PlayerStat) => string };

export type SectionDef =
  | { label: string; type: "general"; rows: GeneralDef[] }
  | { label: string; type: "stat";    rows: StatDef[] };

// ── Analytics / Liga section ───────────────────────────────────────────────────

export type LeaderboardMetric =
  | "goals" | "assists" | "combined" | "rating" | "minutesPlayed"
  | "xgPerGame" | "shotsOnTargetPct"
  | "keyPassesPerGame" | "passAccuracyPct" | "xaPerGame" | "recoveries"
  | "tackles" | "interceptions" | "aerialDuelsWonPct"
  | "savePct" | "cleanSheets" | "goalsConceded";

export type PositionGroup = "todos" | "delanteros" | "mediocampistas" | "defensores" | "arqueros";

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  photoUrl?: string | null;
  position: string;
  nationality?: string | null;
  teamName?: string | null;
  teamLogoUrl?: string | null;
  goals: number;
  assists: number;
  combined: number;
  matchesPlayed: number;
  rating: number;
  tackles: number;
  interceptions: number;
  recoveries: number;
  aerialDuelsWonPct: number;
  keyPassesPerGame: number;
  passAccuracyPct: number;
  xgPerGame: number;
  xaPerGame: number;
  shotsOnTargetPct: number;
  savePct: number;
  cleanSheets: number;
  goalsConceded: number;
  metricValue: number;
}

export interface LeagueSummary {
  totalGoals: number;
  totalAssists: number;
  avgRating: number;
  activePlayers: number;
  totalMatches: number;
}
