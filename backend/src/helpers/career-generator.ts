// Generador dummy de historial de carrera: solo clubes del seed LPF (30 equipos argentinos).
// Sin clubes del exterior ni equipos fuera de `TEAM_SEED_ROWS`.

import { TEAM_SEED_ROWS } from "../db/seed-data/teams.seed";
import type { ClubEntry } from "../types/career";

/** Pool único: los mismos equipos que se insertan en `teams` (Liga Profesional). */
const CLUBS_ARG: ClubEntry[] = TEAM_SEED_ROWS.map(
  (t): ClubEntry => [t.name, t.logoUrl, "LPF"],
);

// ─── HELPERS ────────────────────────────────────────────────────────────────
const rndI = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickExcluding(arr: ClubEntry[], excludeName: string): ClubEntry {
  const filtered = arr.filter((c) => c[0] !== excludeName);
  return pick(filtered.length ? filtered : arr);
}

// ─── GENERADOR PRINCIPAL ─────────────────────────────────────────────────────
export interface CareerStep {
  teamName: string;
  teamLogoUrl: string;
  yearRange: string;
  appearances: number;
  goals: number;
}

interface PlayerInput {
  name: string;
  position: string;
  marketValueM: string;
  debutYear: number;
  nationality: string;
  currentTeamName: string;
  currentTeamLogoUrl: string;
}

export function generateCareer(p: PlayerInput): CareerStep[] {
  const currentYear = 2026;
  const totalYears = currentYear - p.debutYear;

  // Si debutó hace menos de 2 años, solo el club actual
  if (totalYears < 2) {
    return [
      {
        teamName: p.currentTeamName,
        teamLogoUrl: p.currentTeamLogoUrl,
        yearRange: `${p.debutYear}-`,
        appearances: rndI(8, 30),
        goals: genGoals(p.position, rndI(8, 30)),
      },
    ];
  }

  const steps: CareerStep[] = [];
  let cursor = p.debutYear;

  // ── PASO 1: Club de debut (LPF, distinto al actual) ───────────────────────
  const debutDuration = rndI(2, Math.min(4, totalYears - 1));
  const debutClub = pickExcluding(CLUBS_ARG, p.currentTeamName);

  steps.push({
    teamName: debutClub[0],
    teamLogoUrl: debutClub[1],
    yearRange: `${cursor}-${cursor + debutDuration}`,
    appearances: rndI(20, 80),
    goals: genGoals(p.position, rndI(20, 80)),
  });
  cursor += debutDuration;

  // ── PASO 2 (opcional): préstamo / paso intermedio en otra LPF ────────────────
  const yearsLeft = currentYear - cursor;
  if (yearsLeft >= 3 && Math.random() < 0.5) {
    const loanDuration = rndI(1, 2);
    const loanClub = pickExcluding(CLUBS_ARG, p.currentTeamName);

    steps.push({
      teamName: loanClub[0],
      teamLogoUrl: loanClub[1],
      yearRange: `${cursor}-${cursor + loanDuration}`,
      appearances: rndI(15, 50),
      goals: genGoals(p.position, rndI(15, 50)),
    });
    cursor += loanDuration;
  }

  // ── PASO 3 (opcional): otro club LPF antes del actual (sigue siendo dummy local)
  const yearsLeft2 = currentYear - cursor;
  if (yearsLeft2 >= 2 && Math.random() < 0.45) {
    const midDuration = rndI(1, Math.min(3, yearsLeft2 - 1));
    const midClub = pickExcluding(CLUBS_ARG, p.currentTeamName);

    steps.push({
      teamName: midClub[0],
      teamLogoUrl: midClub[1],
      yearRange: `${cursor}-${cursor + midDuration}`,
      appearances: rndI(20, 70),
      goals: genGoals(p.position, rndI(20, 70)),
    });
    cursor += midDuration;
  }

  // ── PASO FINAL: club actual ─────────────────────────────────────────────────
  steps.push({
    teamName: p.currentTeamName,
    teamLogoUrl: p.currentTeamLogoUrl,
    yearRange: `${cursor}-`,
    appearances: rndI(20, Math.max(20, (currentYear - cursor) * 25)),
    goals: genGoals(
      p.position,
      rndI(20, Math.max(20, (currentYear - cursor) * 25)),
    ),
  });

  return steps;
}

// ─── GOLES SEGÚN POSICIÓN ────────────────────────────────────────────────────
function genGoals(position: string, appearances: number): number {
  const rates: Record<string, [number, number]> = {
    CF: [0.35, 0.65],
    SS: [0.25, 0.5],
    LW: [0.18, 0.4],
    RW: [0.18, 0.4],
    CAM: [0.12, 0.3],
    CM: [0.05, 0.15],
    CDM: [0.02, 0.08],
    CB: [0.01, 0.05],
    LB: [0.02, 0.07],
    RB: [0.02, 0.07],
    GK: [0, 0],
  };
  const [min, max] = rates[position] ?? [0.05, 0.15];
  const rate = min + Math.random() * (max - min);
  return Math.round(appearances * rate);
}

// ─── FUNCIÓN PARA INTEGRAR EN EL SEED ────────────────────────────────────────
export function buildCareerRows(
  playerId: number,
  player: PlayerInput,
  careerOverride?: CareerStep[],
): Array<{
  playerId: number;
  teamName: string;
  teamLogoUrl: string;
  yearRange: string;
  appearances: number;
  goals: number;
}> {
  const steps = careerOverride ?? generateCareer(player);
  return steps.map((s) => ({
    playerId,
    teamName: s.teamName,
    teamLogoUrl: s.teamLogoUrl,
    yearRange: s.yearRange,
    appearances: s.appearances,
    goals: s.goals,
  }));
}
