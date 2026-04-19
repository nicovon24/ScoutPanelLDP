/** Stats base “nivel A” por jugador y temporada (años como string, ej. `"2023"`). */
export type RealPlayerSeasonStats = {
  mp: number;
  min: number;
  g: number;
  a: number;
  yc: number;
  rc: number;
  rating: number;
  xgB: number;
  shotB: number;
  shotOTB: number;
  xaB: number;
  kpB: number;
  passB: number;
  tackB: number;
  intB: number;
  recB: number;
  aerB: number;
  dribB: number;
  dribRB: number;
  saveB?: number;
  csB?: number;
};

/** Plantilla nivel B por posición (rangos + bases por 90). */
export type PositionStatTemplate = {
  gRange: [number, number];
  aRange: [number, number];
  mpRange: [number, number];
  ratingR: [number, number];
  xgB: number;
  shotB: number;
  shotOTB: number;
  xaB: number;
  kpB: number;
  passB: number;
  tackB: number;
  intB: number;
  recB: number;
  aerB: number;
  dribB: number;
  dribRB: number;
  saveB?: number;
  csB?: number;
};

/** Fila de jugador antes del insert (teamName → teamId en seed). */
export type PlayerSeedTemplate = {
  name: string;
  position: string;
  marketValueM: string;
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  preferredFoot: string;
  nationality: string;
  teamName: string;
  debutYear: number;
  fotmobPlayerImageId: number;
};

export type InjurySeedConfig = {
  injuryTypesByPosition: Record<string, string[]>;
  seasonStartDates: Record<string, string>;
};
