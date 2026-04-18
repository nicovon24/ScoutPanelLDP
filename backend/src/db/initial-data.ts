//initial data.ts / seed.ts

import * as dotenv from "dotenv";
import path from "path";

// Busca el .env en la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import {
  teams, seasons, players, playerStats,
  playerRatings, playerInjuries, users,
} from "./schema";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const rnd = (min: number, max: number, decimals = 0): number => {
  const val = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
};
const vary = (base: number, pct = 0.2, decimals = 2): string =>
  (base * (1 - pct + Math.random() * pct * 2)).toFixed(decimals);
const varyInt = (base: number, pct = 0.2): number =>
  Math.round(base * (1 - pct + Math.random() * pct * 2));
const addDays = (isoDate: string, days: number): string => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE LESIÓN POR POSICIÓN
// ─────────────────────────────────────────────────────────────────────────────
const INJURY_TYPES: Record<string, string[]> = {
  CF: ["Desgarro isquiotibial", "Esguince de tobillo", "Contusion muscular", "Rotura fibrilar cuadriceps"],
  SS: ["Desgarro isquiotibial", "Esguince de tobillo", "Sobrecarga muscular", "Contusion costal"],
  CAM: ["Esguince de tobillo", "Sobrecarga lumbar", "Desgarro isquiotibial", "Contusion de rodilla"],
  LW: ["Esguince de tobillo", "Desgarro isquiotibial", "Rotura fibrilar gemelo", "Contusion muscular"],
  RW: ["Esguince de tobillo", "Desgarro isquiotibial", "Rotura fibrilar gemelo", "Contusion muscular"],
  CM: ["Sobrecarga muscular", "Esguince de tobillo", "Contusion de rodilla", "Desgarro aductor"],
  CDM: ["Desgarro aductor", "Sobrecarga lumbar", "Contusion de rodilla", "Esguince de tobillo"],
  CB: ["Rotura ligamento cruzado anterior", "Desgarro aductor", "Contusion de rodilla", "Esguince de tobillo"],
  LB: ["Esguince de tobillo", "Desgarro aductor", "Sobrecarga muscular", "Contusion muscular"],
  RB: ["Esguince de tobillo", "Desgarro aductor", "Sobrecarga muscular", "Contusion muscular"],
  GK: ["Fractura de dedo", "Esguince de muneca", "Contusion de hombro", "Desgarro isquiotibial"],
};

const SEASON_START: Record<number, string> = {
  2020: "2020-01-18",
  2021: "2021-01-23",
  2022: "2022-01-22",
  2023: "2023-01-21",
  2024: "2024-01-20",
  2025: "2025-01-18",
  2026: "2026-01-17",
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE STATS POR POSICIÓN
// ─────────────────────────────────────────────────────────────────────────────
interface BaseStats {
  goals: number; xgPerGame: number; shotsPerGame: number; shotsOnTargetPct: number;
  assists: number; xaPerGame: number; keyPassesPerGame: number; passAccuracyPct: number;
  tackles: number; interceptions: number; recoveries: number; aerialDuelsWonPct: number;
  successfulDribblesPerGame: number; dribbleSuccessRate: number;
  savePct: number | null; cleanSheets: number | null; goalsConceded: number | null;
  sofascoreRating: number; yellowCards: number;
}

const BASE_STATS: Record<string, BaseStats> = {
  CF: { goals: 16, xgPerGame: 0.58, shotsPerGame: 3.2, shotsOnTargetPct: 43, assists: 4, xaPerGame: 0.12, keyPassesPerGame: 0.8, passAccuracyPct: 72, tackles: 8, interceptions: 4, recoveries: 12, aerialDuelsWonPct: 48, successfulDribblesPerGame: 1.6, dribbleSuccessRate: 46, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.2, yellowCards: 2 },
  SS: { goals: 12, xgPerGame: 0.42, shotsPerGame: 2.4, shotsOnTargetPct: 40, assists: 8, xaPerGame: 0.28, keyPassesPerGame: 1.6, passAccuracyPct: 76, tackles: 12, interceptions: 6, recoveries: 18, aerialDuelsWonPct: 32, successfulDribblesPerGame: 2.1, dribbleSuccessRate: 52, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.3, yellowCards: 3 },
  CAM: { goals: 8, xgPerGame: 0.28, shotsPerGame: 1.8, shotsOnTargetPct: 38, assists: 10, xaPerGame: 0.38, keyPassesPerGame: 2.4, passAccuracyPct: 82, tackles: 14, interceptions: 8, recoveries: 22, aerialDuelsWonPct: 28, successfulDribblesPerGame: 1.8, dribbleSuccessRate: 50, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.1, yellowCards: 2 },
  LW: { goals: 10, xgPerGame: 0.34, shotsPerGame: 2.6, shotsOnTargetPct: 39, assists: 9, xaPerGame: 0.32, keyPassesPerGame: 1.9, passAccuracyPct: 74, tackles: 10, interceptions: 5, recoveries: 14, aerialDuelsWonPct: 22, successfulDribblesPerGame: 2.8, dribbleSuccessRate: 55, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.0, yellowCards: 2 },
  RW: { goals: 10, xgPerGame: 0.34, shotsPerGame: 2.6, shotsOnTargetPct: 39, assists: 9, xaPerGame: 0.32, keyPassesPerGame: 1.9, passAccuracyPct: 74, tackles: 10, interceptions: 5, recoveries: 14, aerialDuelsWonPct: 22, successfulDribblesPerGame: 2.8, dribbleSuccessRate: 55, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.0, yellowCards: 2 },
  CM: { goals: 4, xgPerGame: 0.12, shotsPerGame: 1.0, shotsOnTargetPct: 33, assists: 6, xaPerGame: 0.18, keyPassesPerGame: 1.4, passAccuracyPct: 86, tackles: 42, interceptions: 24, recoveries: 38, aerialDuelsWonPct: 42, successfulDribblesPerGame: 1.0, dribbleSuccessRate: 44, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.0, yellowCards: 4 },
  CDM: { goals: 2, xgPerGame: 0.05, shotsPerGame: 0.6, shotsOnTargetPct: 28, assists: 4, xaPerGame: 0.08, keyPassesPerGame: 0.9, passAccuracyPct: 88, tackles: 68, interceptions: 38, recoveries: 52, aerialDuelsWonPct: 52, successfulDribblesPerGame: 0.7, dribbleSuccessRate: 40, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 7.0, yellowCards: 5 },
  CB: { goals: 2, xgPerGame: 0.06, shotsPerGame: 0.4, shotsOnTargetPct: 25, assists: 1, xaPerGame: 0.03, keyPassesPerGame: 0.4, passAccuracyPct: 84, tackles: 72, interceptions: 44, recoveries: 58, aerialDuelsWonPct: 62, successfulDribblesPerGame: 0.4, dribbleSuccessRate: 36, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 6.9, yellowCards: 4 },
  RB: { goals: 1, xgPerGame: 0.04, shotsPerGame: 0.5, shotsOnTargetPct: 28, assists: 4, xaPerGame: 0.12, keyPassesPerGame: 0.8, passAccuracyPct: 82, tackles: 52, interceptions: 28, recoveries: 40, aerialDuelsWonPct: 44, successfulDribblesPerGame: 0.9, dribbleSuccessRate: 42, savePct: null, cleanSheets: null, goalsConceded: null, sofascoreRating: 6.9, yellowCards: 3 },
  GK: { goals: 0, xgPerGame: 0.00, shotsPerGame: 0.0, shotsOnTargetPct: 0, assists: 0, xaPerGame: 0.00, keyPassesPerGame: 0.2, passAccuracyPct: 62, tackles: 2, interceptions: 1, recoveries: 4, aerialDuelsWonPct: 70, successfulDribblesPerGame: 0.1, dribbleSuccessRate: 25, savePct: 72, cleanSheets: 10, goalsConceded: 28, sofascoreRating: 7.0, yellowCards: 1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹 Limpiando base de datos y reseteando IDs...");
  
  // Truncate resetea los IDs a 1 y CASCADE se encarga del orden por nosotros
  await db.execute(sql`
    TRUNCATE TABLE 
      player_injuries, 
      player_ratings, 
      player_stats, 
      players, 
      seasons, 
      teams, 
      users 
    RESTART IDENTITY CASCADE
  `);
  
  console.log("🌱 Iniciando seed V5...");

  // ── 1. EQUIPOS ─────────────────────────────────────────────────────────────
  const insertedTeams = await db.insert(teams).values([
    { name: "Inter Miami", country: "USA", logoUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Inter_Miami_CF_crest.svg" },
    { name: "Real Madrid", country: "Spain", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    { name: "Manchester City", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
    { name: "Liverpool", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
    { name: "Bayern Munich", country: "Germany", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg" },
    { name: "Atletico Madrid", country: "Spain", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg" },
    { name: "Aston Villa", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_crest_%282016%29.svg" },
    { name: "Tottenham", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
    { name: "Arsenal", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
    { name: "Barcelona", country: "Spain", logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    { name: "Chelsea", country: "England", logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
    { name: "Inter Milan", country: "Italy", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
    { name: "Borussia Dortmund", country: "Germany", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg" },
    { name: "Al-Nassr", country: "Saudi Arabia", logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2b/Al_Nassr_FC_Logo.svg" },
    { name: "Al-Hilal", country: "Saudi Arabia", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/fa/Al-Hilal_Logo.svg" },
    { name: "River Plate", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/ac/Club_Atl%C3%A9tico_River_Plate_crest.svg" },
    { name: "Talleres", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Escudo_Club_Atl%C3%A9tico_Talleres.svg" },
    { name: "Belgrano", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/13/Escudo_del_Club_Atl%C3%A9tico_Belgrano.svg" },
    { name: "Instituto", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Logotipo_del_Instituto_Atl%C3%A9tico_Central_C%C3%B3rdoba.svg" },
  ]).returning();

  const teamMap: Record<string, typeof insertedTeams[0]> = {};
  insertedTeams.forEach(t => { teamMap[t.name] = t; });

  // ── 2. TEMPORADAS ──────────────────────────────────────────────────────────
  const insertedSeasons = await db.insert(seasons).values([
    { name: "2020", year: 2020 },
    { name: "2021", year: 2021 },
    { name: "2022", year: 2022 },
    { name: "2023", year: 2023 },
    { name: "2024", year: 2024 },
    { name: "2025", year: 2025 },
    { name: "2026", year: 2026 },
  ]).returning();

  // ── 3. JUGADORES ──────────────────────────────────────────────────────────
  const playersData = [
    { name: "Lionel Messi", position: "SS", marketValueM: "25.00", dateOfBirth: "1987-06-24", heightCm: 170, weightKg: 72, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Inter Miami"].id, photoUrl: "https://ui-avatars.com/api/?name=Lionel+Messi&background=random", debutYear: 2004 },
    { name: "Cristiano Ronaldo", position: "CF", marketValueM: "15.00", dateOfBirth: "1985-02-05", heightCm: 187, weightKg: 83, preferredFoot: "Right", nationality: "Portugal", teamId: teamMap["Al-Nassr"].id, photoUrl: "https://ui-avatars.com/api/?name=Cristiano+Ronaldo&background=random", debutYear: 2002 },
    { name: "Kylian Mbappe", position: "CF", marketValueM: "180.00", dateOfBirth: "1998-12-20", heightCm: 178, weightKg: 73, preferredFoot: "Right", nationality: "France", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Kylian+Mbappe&background=random", debutYear: 2015 },
    { name: "Jude Bellingham", position: "CAM", marketValueM: "180.00", dateOfBirth: "2003-06-29", heightCm: 186, weightKg: 83, preferredFoot: "Right", nationality: "England", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Jude+Bellingham&background=random", debutYear: 2019 },
    { name: "Vinicius Junior", position: "LW", marketValueM: "200.00", dateOfBirth: "2000-07-12", heightCm: 176, weightKg: 73, preferredFoot: "Right", nationality: "Brazil", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Vinicius+Junior&background=random", debutYear: 2017 },
    { name: "Erling Haaland", position: "CF", marketValueM: "200.00", dateOfBirth: "2000-07-21", heightCm: 194, weightKg: 88, preferredFoot: "Left", nationality: "Norway", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Erling+Haaland&background=random", debutYear: 2016 },
    { name: "Lamine Yamal", position: "RW", marketValueM: "180.00", dateOfBirth: "2007-07-13", heightCm: 176, weightKg: 65, preferredFoot: "Left", nationality: "Spain", teamId: teamMap["Barcelona"].id, photoUrl: "https://ui-avatars.com/api/?name=Lamine+Yamal&background=random", debutYear: 2023 },
    { name: "Julian Alvarez", position: "CF", marketValueM: "90.00", dateOfBirth: "2000-01-31", heightCm: 170, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Atletico Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Julian+Alvarez&background=random", debutYear: 2018 },
    { name: "Enzo Fernandez", position: "CM", marketValueM: "60.00", dateOfBirth: "2001-01-17", heightCm: 178, weightKg: 74, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Chelsea"].id, photoUrl: "https://ui-avatars.com/api/?name=Enzo+Fernandez&background=random", debutYear: 2019 },

    // ── Real Madrid ───────────────────────────────────────────────────────────
    { name: "Federico Valverde", position: "CM", marketValueM: "120.00", dateOfBirth: "1998-07-22", heightCm: 182, weightKg: 78, preferredFoot: "Right", nationality: "Uruguay", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Federico+Valverde&background=random", debutYear: 2016 },
    { name: "Rodrygo Goes", position: "RW", marketValueM: "90.00", dateOfBirth: "2001-01-09", heightCm: 174, weightKg: 64, preferredFoot: "Left", nationality: "Brazil", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Rodrygo+Goes&background=random", debutYear: 2018 },

    // ── Manchester City ───────────────────────────────────────────────────────
    { name: "Kevin De Bruyne", position: "CAM", marketValueM: "60.00", dateOfBirth: "1991-06-28", heightCm: 181, weightKg: 70, preferredFoot: "Right", nationality: "Belgium", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Kevin+De+Bruyne&background=random", debutYear: 2008 },
    { name: "Rodri", position: "CDM", marketValueM: "150.00", dateOfBirth: "1996-06-22", heightCm: 191, weightKg: 82, preferredFoot: "Right", nationality: "Spain", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Rodri&background=random", debutYear: 2015 },
    { name: "Phil Foden", position: "CAM", marketValueM: "150.00", dateOfBirth: "2000-05-28", heightCm: 171, weightKg: 70, preferredFoot: "Left", nationality: "England", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Phil+Foden&background=random", debutYear: 2017 },

    // ── Liverpool ─────────────────────────────────────────────────────────────
    { name: "Mohamed Salah", position: "RW", marketValueM: "50.00", dateOfBirth: "1992-06-15", heightCm: 175, weightKg: 71, preferredFoot: "Left", nationality: "Egypt", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Mohamed+Salah&background=random", debutYear: 2010 },
    { name: "Virgil van Dijk", position: "CB", marketValueM: "45.00", dateOfBirth: "1991-07-08", heightCm: 193, weightKg: 92, preferredFoot: "Right", nationality: "Netherlands", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Virgil+van+Dijk&background=random", debutYear: 2010 },
    { name: "Alexis Mac Allister", position: "CM", marketValueM: "80.00", dateOfBirth: "1998-12-24", heightCm: 174, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Alexis+Mac+Allister&background=random", debutYear: 2016 },
    { name: "Alisson Becker", position: "GK", marketValueM: "50.00", dateOfBirth: "1992-10-02", heightCm: 191, weightKg: 91, preferredFoot: "Right", nationality: "Brazil", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Alisson+Becker&background=random", debutYear: 2012 },
    { name: "Florian Wirtz", position: "CAM", marketValueM: "150.00", dateOfBirth: "2003-05-03", heightCm: 176, weightKg: 70, preferredFoot: "Right", nationality: "Germany", teamId: teamMap["Borussia Dortmund"].id, photoUrl: "https://ui-avatars.com/api/?name=Florian+Wirtz&background=random", debutYear: 2020 },

    // ── Bayern Munich ─────────────────────────────────────────────────────────
    { name: "Harry Kane", position: "CF", marketValueM: "100.00", dateOfBirth: "1993-07-28", heightCm: 188, weightKg: 86, preferredFoot: "Right", nationality: "England", teamId: teamMap["Bayern Munich"].id, photoUrl: "https://ui-avatars.com/api/?name=Harry+Kane&background=random", debutYear: 2011 },
    { name: "Jamal Musiala", position: "CAM", marketValueM: "150.00", dateOfBirth: "2003-02-26", heightCm: 180, weightKg: 70, preferredFoot: "Right", nationality: "Germany", teamId: teamMap["Bayern Munich"].id, photoUrl: "https://ui-avatars.com/api/?name=Jamal+Musiala&background=random", debutYear: 2020 },
    { name: "Leroy Sane", position: "LW", marketValueM: "40.00", dateOfBirth: "1996-01-11", heightCm: 183, weightKg: 75, preferredFoot: "Right", nationality: "Germany", teamId: teamMap["Bayern Munich"].id, photoUrl: "https://ui-avatars.com/api/?name=Leroy+Sane&background=random", debutYear: 2014 },

    // ── Arsenal ───────────────────────────────────────────────────────────────
    { name: "Bukayo Saka", position: "RW", marketValueM: "150.00", dateOfBirth: "2001-09-05", heightCm: 178, weightKg: 72, preferredFoot: "Left", nationality: "England", teamId: teamMap["Arsenal"].id, photoUrl: "https://ui-avatars.com/api/?name=Bukayo+Saka&background=random", debutYear: 2018 },
    { name: "Martin Odegaard", position: "CAM", marketValueM: "90.00", dateOfBirth: "1998-12-17", heightCm: 178, weightKg: 68, preferredFoot: "Right", nationality: "Norway", teamId: teamMap["Arsenal"].id, photoUrl: "https://ui-avatars.com/api/?name=Martin+Odegaard&background=random", debutYear: 2014 },

    // ── Barcelona ─────────────────────────────────────────────────────────────
    { name: "Raphinha", position: "RW", marketValueM: "80.00", dateOfBirth: "1996-12-14", heightCm: 176, weightKg: 68, preferredFoot: "Left", nationality: "Brazil", teamId: teamMap["Barcelona"].id, photoUrl: "https://ui-avatars.com/api/?name=Raphinha&background=random", debutYear: 2014 },
    { name: "Pedri", position: "CM", marketValueM: "100.00", dateOfBirth: "2002-11-25", heightCm: 174, weightKg: 60, preferredFoot: "Right", nationality: "Spain", teamId: teamMap["Barcelona"].id, photoUrl: "https://ui-avatars.com/api/?name=Pedri&background=random", debutYear: 2020 },

    // ── Tottenham ─────────────────────────────────────────────────────────────
    { name: "Cristian Romero", position: "CB", marketValueM: "70.00", dateOfBirth: "1998-04-27", heightCm: 185, weightKg: 79, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Tottenham"].id, photoUrl: "https://ui-avatars.com/api/?name=Cristian+Romero&background=random", debutYear: 2016 },

    // ── Aston Villa ───────────────────────────────────────────────────────────
    { name: "Emiliano Martinez", position: "GK", marketValueM: "40.00", dateOfBirth: "1992-09-02", heightCm: 195, weightKg: 88, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Aston Villa"].id, photoUrl: "https://ui-avatars.com/api/?name=Emiliano+Martinez&background=random", debutYear: 2010 },

    // ── Inter Milan ───────────────────────────────────────────────────────────
    { name: "Lautaro Martinez", position: "CF", marketValueM: "110.00", dateOfBirth: "1997-08-22", heightCm: 174, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Inter Milan"].id, photoUrl: "https://ui-avatars.com/api/?name=Lautaro+Martinez&background=random", debutYear: 2015 },
    { name: "Nicolo Barella", position: "CM", marketValueM: "80.00", dateOfBirth: "1997-02-07", heightCm: 172, weightKg: 68, preferredFoot: "Right", nationality: "Italy", teamId: teamMap["Inter Milan"].id, photoUrl: "https://ui-avatars.com/api/?name=Nicolo+Barella&background=random", debutYear: 2015 },


    // ── Al-Hilal ─────────────────────────────────────────────────────────────
    { name: "Neymar Jr", position: "LW", marketValueM: "20.00", dateOfBirth: "1992-02-05", heightCm: 175, weightKg: 68, preferredFoot: "Right", nationality: "Brazil", teamId: teamMap["Al-Hilal"].id, photoUrl: "https://ui-avatars.com/api/?name=Neymar+Jr&background=random", debutYear: 2009 },

    // ── River Plate ───────────────────────────────────────────────────────────
    { name: "Franco Mastantuono", position: "CAM", marketValueM: "35.00", dateOfBirth: "2008-08-10", heightCm: 177, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["River Plate"].id, photoUrl: "https://ui-avatars.com/api/?name=Franco+Mastantuono&background=random", debutYear: 2024 },

    // ── Talleres (Córdoba) ────────────────────────────────────────────────────
    { name: "Ronaldo Martinez", position: "CF", marketValueM: "2.00", dateOfBirth: "1998-04-24", heightCm: 178, weightKg: 74, preferredFoot: "Right", nationality: "Paraguay", teamId: teamMap["Talleres"].id, photoUrl: "https://ui-avatars.com/api/?name=Ronaldo+Martinez&background=random", debutYear: 2017 },

    // ── Belgrano (Córdoba) ────────────────────────────────────────────────────
    { name: "Lucas Zelarayan", position: "CAM", marketValueM: "4.00", dateOfBirth: "1992-06-20", heightCm: 178, weightKg: 73, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Belgrano"].id, photoUrl: "https://ui-avatars.com/api/?name=Lucas+Zelarayan&background=random", debutYear: 2011 },
  ];

  const insertedPlayers = await db.insert(players).values(playersData).returning();

  // ── 4. STATS Y RATINGS ─────────────────────────────────────────────────────
  const statsData: (typeof playerStats.$inferInsert)[] = [];
  const ratingsData: (typeof playerRatings.$inferInsert)[] = [];

  for (const player of insertedPlayers) {
    const base = BASE_STATS[player.position] ?? BASE_STATS["CM"];

    for (const season of insertedSeasons) {
      if (season.year < (player.debutYear ?? 0)) continue;

      const matches = rnd(28, 38);
      const rating = parseFloat((base.sofascoreRating + rnd(-4, 4) / 10).toFixed(1));

      // --- Lógica Dinámica de Valor de Mercado ---
      const birthYear = new Date(player.dateOfBirth!).getFullYear();
      const age = season.year - birthYear;
      let currentVal = parseFloat(player.marketValueM ?? "0");

      if (season.year > 2024) {
        if (age < 23) {
          // Jóvenes: Crecen mucho con buen rating
          currentVal *= (rating > 7.0 ? 1.30 : 1.05);
        } else if (age < 30) {
          // Prime: Crecimiento balanceado
          currentVal *= (rating > 7.2 ? 1.15 : 0.95);
        } else if (age < 34) {
          // Veteranos: Empiezan a bajar salvo que sean cracks
          currentVal *= (rating > 7.4 ? 1.05 : 0.85);
        } else {
          // Seniors: Bajan casi siempre por edad
          currentVal *= (rating > 7.5 ? 0.95 : 0.80);
        }
      }

      statsData.push({
        playerId: player.id,
        seasonId: season.id,
        matchesPlayed: matches,
        minutesPlayed: matches * rnd(70, 90),
        marketValueM: currentVal.toFixed(2),
        goals: varyInt(base.goals),
        xgPerGame: vary(base.xgPerGame),
        shotsPerGame: vary(base.shotsPerGame),
        shotsOnTargetPct: vary(base.shotsOnTargetPct, 0.15, 2),
        assists: varyInt(base.assists),
        xaPerGame: vary(base.xaPerGame),
        keyPassesPerGame: vary(base.keyPassesPerGame),
        passAccuracyPct: vary(base.passAccuracyPct, 0.05, 2),
        tackles: varyInt(base.tackles),
        interceptions: varyInt(base.interceptions),
        recoveries: varyInt(base.recoveries),
        aerialDuelsWonPct: vary(base.aerialDuelsWonPct, 0.1, 2),
        successfulDribblesPerGame: vary(base.successfulDribblesPerGame),
        dribbleSuccessRate: vary(base.dribbleSuccessRate, 0.1, 2),
        savePct: base.savePct !== null ? vary(base.savePct, 0.08, 2) : null,
        cleanSheets: base.cleanSheets !== null ? varyInt(base.cleanSheets, 0.25) : null,
        goalsConceded: base.goalsConceded !== null ? varyInt(base.goalsConceded, 0.25) : null,
        sofascoreRating: String(rating),
        yellowCards: varyInt(base.yellowCards, 0.5),
        redCards: Math.random() < 0.1 ? 1 : 0,
      });

      const months = season.year === 2026
        ? ["01", "02", "03", "04"]
        : ["02", "03", "04", "05", "08", "09", "10", "11"];
      const ratingByMonth: Record<string, number> = {};
      months.forEach((m) => {
        ratingByMonth[`${season.year}-${m}`] = parseFloat((rating + rnd(-3, 3) / 10).toFixed(1));
      });

      ratingsData.push({
        playerId: player.id,
        seasonId: season.id,
        seasonRating: String(rating),
        ratingByMonth,
      });
    }
  }

  await db.insert(playerStats).values(statsData);
  await db.insert(playerRatings).values(ratingsData);

  // ── 5. LESIONES ────────────────────────────────────────────────────────────
  const injuriesData: (typeof playerInjuries.$inferInsert)[] = [];

  for (const player of insertedPlayers) {
    const injuryPool = INJURY_TYPES[player.position] ?? INJURY_TYPES["CM"];

    for (const season of insertedSeasons) {
      if (season.year < (player.debutYear ?? 0)) continue;

      const injuryChance = season.year === 2026 ? 0.25 : 0.40;
      if (Math.random() > injuryChance) continue;

      const numInjuries = Math.random() < 0.2 ? 2 : 1;
      const seasonStart = SEASON_START[season.year];
      let offsetDays = rnd(10, 60);

      for (let i = 0; i < numInjuries; i++) {
        const injuryType = injuryPool[Math.floor(Math.random() * injuryPool.length)];

        let daysOut: number;
        if (injuryType.includes("Rotura ligamento")) {
          daysOut = rnd(150, 270);
        } else if (injuryType.includes("Desgarro") || injuryType.includes("Fractura")) {
          daysOut = rnd(21, 55);
        } else {
          daysOut = rnd(5, 20);
        }

        const startedAt = addDays(seasonStart, offsetDays);
        const returnedAt = addDays(startedAt, daysOut);

        injuriesData.push({
          playerId: player.id,
          seasonId: season.id,
          injuryType,
          startedAt,
          returnedAt,
          daysOut,
        });

        offsetDays += daysOut + rnd(30, 60);
      }
    }
  }

  if (injuriesData.length > 0) {
    await db.insert(playerInjuries).values(injuriesData);
  }

  // ── 6. USUARIO DEMO ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("scout1234", 10);
  await db.insert(users).values({
    email: "scout@demo.com",
    passwordHash,
    name: "Scout Demo",
  }).onConflictDoNothing();

  console.log("✅ Seed V5 completado:");
  console.log(`   ${insertedTeams.length}  equipos`);
  console.log(`   ${insertedSeasons.length}  temporadas`);
  console.log(`   ${insertedPlayers.length} jugadores`);
  console.log(`   ${statsData.length}  registros en player_stats`);
  console.log(`   ${ratingsData.length}  registros en player_ratings`);
  console.log(`   ${injuriesData.length}  registros en player_injuries`);

  await pool.end();
}

main().catch((err) => {
  console.error("❌ Falló el seed:", err);
  process.exit(1);
});
