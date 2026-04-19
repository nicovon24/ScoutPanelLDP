// Generador automático de historial de carrera
// Lógica: debutYear + nacionalidad + posición → pasos coherentes
// Se usa como fallback para jugadores sin CAREER_DATA hardcodeado

import { TEAM_SEED_ROWS } from "../db/seed-data/teams.seed";
import type { ClubEntry } from "../types/career";

// ─── POOLS DE CLUBES POR PAÍS/LIGA ───────────────────────────────────────────
// Cada club tiene: [name, logoUrl, "liga"]. LPF desde seed + clubes extra (historial).
const CLUBS_ARG_EXTRA: ClubEntry[] = [
  ["Colón",               "https://images.fotmob.com/image_resources/logo/teamlogo/161725.png","LPF"],
  ["Patronato",           "https://images.fotmob.com/image_resources/logo/teamlogo/161726.png","LPF"],
  ["Godoy Cruz",          "https://images.fotmob.com/image_resources/logo/teamlogo/10097.png", "LPF"],
  ["Olimpo",              "https://images.fotmob.com/image_resources/logo/teamlogo/213594.png","LPF"],
  ["San Martín (T)",      "https://images.fotmob.com/image_resources/logo/teamlogo/213593.png","Nacional B"],
  ["Almirante Brown",     "https://images.fotmob.com/image_resources/logo/teamlogo/213537.png","Nacional B"],
  ["San Martín (SJ)",     "https://images.fotmob.com/image_resources/logo/teamlogo/213590.png","Nacional B"],
  ["Nueva Chicago",       "https://images.fotmob.com/image_resources/logo/teamlogo/213588.png","Nacional B"],
  ["Chacarita Juniors",   "https://images.fotmob.com/image_resources/logo/teamlogo/213543.png","Nacional B"],
  ["All Boys",            "https://images.fotmob.com/image_resources/logo/teamlogo/213535.png","Nacional B"],
];

const seedNames = new Set<string>(TEAM_SEED_ROWS.map((t) => t.name));
const CLUBS_ARG: ClubEntry[] = [
  ...TEAM_SEED_ROWS.map((t): ClubEntry => [t.name, t.logoUrl, "LPF"]),
  ...CLUBS_ARG_EXTRA.filter(c => !seedNames.has(c[0])),
];

// Clubes extranjeros donde suelen ir argentinos
const CLUBS_EXTERIOR: ClubEntry[] = [
  // España
  ["Sevilla",         "https://images.fotmob.com/image_resources/logo/teamlogo/133.png",   "LaLiga"],
  ["Valencia",        "https://images.fotmob.com/image_resources/logo/teamlogo/140.png",   "LaLiga"],
  ["Getafe",          "https://images.fotmob.com/image_resources/logo/teamlogo/4716.png",  "LaLiga"],
  ["Celta de Vigo",   "https://images.fotmob.com/image_resources/logo/teamlogo/3722.png",  "LaLiga"],
  ["Osasuna",         "https://images.fotmob.com/image_resources/logo/teamlogo/331.png",   "LaLiga"],
  ["Espanyol",        "https://images.fotmob.com/image_resources/logo/teamlogo/728.png",   "LaLiga"],
  // Italia
  ["Fiorentina",      "https://images.fotmob.com/image_resources/logo/teamlogo/47.png",    "SerieA"],
  ["Udinese",         "https://images.fotmob.com/image_resources/logo/teamlogo/55.png",    "SerieA"],
  ["Genoa",           "https://images.fotmob.com/image_resources/logo/teamlogo/48.png",    "SerieA"],
  ["Sassuolo",        "https://images.fotmob.com/image_resources/logo/teamlogo/9156.png",  "SerieA"],
  // México
  ["Tigres UANL",     "https://images.fotmob.com/image_resources/logo/teamlogo/8892.png",  "Liga MX"],
  ["América",         "https://images.fotmob.com/image_resources/logo/teamlogo/8882.png",  "Liga MX"],
  ["Cruz Azul",       "https://images.fotmob.com/image_resources/logo/teamlogo/8887.png",  "Liga MX"],
  ["Monterrey",       "https://images.fotmob.com/image_resources/logo/teamlogo/8890.png",  "Liga MX"],
  // MLS
  ["Atlanta United",  "https://images.fotmob.com/image_resources/logo/teamlogo/16055.png", "MLS"],
  ["Austin FC",       "https://images.fotmob.com/image_resources/logo/teamlogo/17017.png", "MLS"],
  ["Inter Miami",     "https://images.fotmob.com/image_resources/logo/teamlogo/17011.png", "MLS"],
  ["Columbus Crew",   "https://images.fotmob.com/image_resources/logo/teamlogo/16057.png", "MLS"],
  // Brasil
  ["Palmeiras",       "https://images.fotmob.com/image_resources/logo/teamlogo/16.png",    "Brasileirao"],
  ["Fluminense",      "https://images.fotmob.com/image_resources/logo/teamlogo/17.png",    "Brasileirao"],
  ["Internacional",   "https://images.fotmob.com/image_resources/logo/teamlogo/20.png",    "Brasileirao"],
  // Uruguay/Paraguay
  ["Peñarol",         "https://images.fotmob.com/image_resources/logo/teamlogo/8638.png",  "Uruguay"],
  ["Nacional (UY)",   "https://images.fotmob.com/image_resources/logo/teamlogo/8639.png",  "Uruguay"],
  ["Olimpia",         "https://images.fotmob.com/image_resources/logo/teamlogo/8637.png",  "Paraguay"],
  ["Cerro Porteño",   "https://images.fotmob.com/image_resources/logo/teamlogo/8633.png",  "Paraguay"],
  // Chile
  ["Colo-Colo",       "https://images.fotmob.com/image_resources/logo/teamlogo/8870.png",  "Chile"],
  ["Universidad de Chile","https://images.fotmob.com/image_resources/logo/teamlogo/8871.png","Chile"],
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const rndI = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Excluye el club actual del jugador para no repetirlo
function pickExcluding(arr: ClubEntry[], excludeName: string): ClubEntry {
  const filtered = arr.filter(c => c[0] !== excludeName);
  return pick(filtered.length ? filtered : arr);
}

// ─── LÓGICA DE PROBABILIDAD DE SALIDA AL EXTERIOR ────────────────────────────
// Según posición y valor de mercado: delanteros y mediocampistas creativos
// tienen más chances de haber pasado por el exterior
const EXTERIOR_PROB: Record<string, number> = {
  CF: 0.45, SS: 0.40, LW: 0.40, RW: 0.40,
  CAM: 0.35, CM: 0.25, CDM: 0.20,
  CB: 0.25, LB: 0.20, RB: 0.20,
  GK: 0.15,
};

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
  const mv = parseFloat(p.marketValueM);

  // Si debutó hace menos de 2 años, solo el club actual
  if (totalYears < 2) {
    return [{
      teamName: p.currentTeamName,
      teamLogoUrl: p.currentTeamLogoUrl,
      yearRange: `${p.debutYear}-`,
      appearances: rndI(8, 30),
      goals: genGoals(p.position, rndI(8, 30)),
    }];
  }

  const steps: CareerStep[] = [];
  let cursor = p.debutYear;

  // ── PASO 1: Club de debut (siempre local) ──────────────────────────────────
  // Jugadores que debutan en su mismo club actual: no agregan paso extra
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

  // ── PASO 2 (opcional): Préstamo o paso intermedio ─────────────────────────
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

  // ── PASO 3 (opcional): Paso por el exterior ───────────────────────────────
  const exteriorProb = (EXTERIOR_PROB[p.position] ?? 0.25) * (mv > 4 ? 1.4 : 1);
  const yearsLeft2 = currentYear - cursor;

  if (yearsLeft2 >= 2 && Math.random() < Math.min(exteriorProb, 0.75)) {
    const extDuration = rndI(1, Math.min(3, yearsLeft2 - 1));
    const extClub = pick(CLUBS_EXTERIOR);

    steps.push({
      teamName: extClub[0],
      teamLogoUrl: extClub[1],
      yearRange: `${cursor}-${cursor + extDuration}`,
      appearances: rndI(20, 70),
      goals: genGoals(p.position, rndI(20, 70)),
    });
    cursor += extDuration;
  }

  // ── PASO FINAL: Club actual ───────────────────────────────────────────────
  steps.push({
    teamName: p.currentTeamName,
    teamLogoUrl: p.currentTeamLogoUrl,
    yearRange: `${cursor}-`,
    appearances: rndI(20, Math.max(20, (currentYear - cursor) * 25)),
    goals: genGoals(p.position, rndI(20, Math.max(20, (currentYear - cursor) * 25))),
  });

  return steps;
}

// ─── GOLES SEGÚN POSICIÓN ────────────────────────────────────────────────────
// Proporcional a partidos jugados pero con tasa distinta por posición
function genGoals(position: string, appearances: number): number {
  const rates: Record<string, [number, number]> = {
    CF:  [0.35, 0.65], SS:  [0.25, 0.50], LW:  [0.18, 0.40],
    RW:  [0.18, 0.40], CAM: [0.12, 0.30], CM:  [0.05, 0.15],
    CDM: [0.02, 0.08], CB:  [0.01, 0.05], LB:  [0.02, 0.07],
    RB:  [0.02, 0.07], GK:  [0.00, 0.00],
  };
  const [min, max] = rates[position] ?? [0.05, 0.15];
  const rate = min + Math.random() * (max - min);
  return Math.round(appearances * rate);
}

// ─── FUNCIÓN PARA INTEGRAR EN EL SEED ────────────────────────────────────────
// Recibe el jugador insertado + el equipo ya insertado
// Devuelve los registros listos para insertar en player_career
export function buildCareerRows(
  playerId: number,
  player: PlayerInput,
  careerOverride?: CareerStep[], // si existe en CAREER_DATA, usa ese
): Array<{
  playerId: number;
  teamName: string;
  teamLogoUrl: string;
  yearRange: string;
  appearances: number;
  goals: number;
}> {
  const steps = careerOverride ?? generateCareer(player);
  return steps.map(s => ({
    playerId,
    teamName:     s.teamName,
    teamLogoUrl:  s.teamLogoUrl,
    yearRange:    s.yearRange,
    appearances:  s.appearances,
    goals:        s.goals,
  }));
}