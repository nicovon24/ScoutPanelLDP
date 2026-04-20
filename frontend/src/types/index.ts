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
  foot: string;
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  minRating: string;
  marketValueMax: string;
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
  d?: number;
  u?: string;
  lower?: boolean;
  max: number;
  accent: string;
};

export type GeneralDef = { l: string; fn: (player: any, stat: any) => string };

export type SectionDef =
  | { label: string; type: "general"; rows: GeneralDef[] }
  | { label: string; type: "stat";    rows: StatDef[] };
