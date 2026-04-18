//initial data.ts / seed.ts

import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
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
  ]).returning();

  const teamMap: Record<string, typeof insertedTeams[0]> = {};
  insertedTeams.forEach(t => { teamMap[t.name] = t; });

  // ── 2. TEMPORADAS ──────────────────────────────────────────────────────────
  const insertedSeasons = await db.insert(seasons).values([
    { name: "2024", year: 2024 },
    { name: "2025", year: 2025 },
    { name: "2026", year: 2026 },
  ]).returning();

  // ── 3. JUGADORES ──────────────────────────────────────────────────────────
  const playersData = [
    { name: "Lionel Messi", position: "SS", marketValueM: "25.00", dateOfBirth: "1987-06-24", heightCm: 170, weightKg: 72, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Inter Miami"].id, photoUrl: "https://ui-avatars.com/api/?name=Lionel+Messi&background=random" },
    { name: "Kylian Mbappe", position: "CF", marketValueM: "180.00", dateOfBirth: "1998-12-20", heightCm: 178, weightKg: 73, preferredFoot: "Right", nationality: "France", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Kylian+Mbappe&background=random" },
    { name: "Jude Bellingham", position: "CAM", marketValueM: "180.00", dateOfBirth: "2003-06-29", heightCm: 186, weightKg: 83, preferredFoot: "Right", nationality: "England", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Jude+Bellingham&background=random" },
    { name: "Vinicius Junior", position: "LW", marketValueM: "200.00", dateOfBirth: "2000-07-12", heightCm: 176, weightKg: 73, preferredFoot: "Right", nationality: "Brazil", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Vinicius+Junior&background=random" },
    { name: "Federico Valverde", position: "CM", marketValueM: "120.00", dateOfBirth: "1998-07-22", heightCm: 182, weightKg: 78, preferredFoot: "Right", nationality: "Uruguay", teamId: teamMap["Real Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Federico+Valverde&background=random" },
    { name: "Erling Haaland", position: "CF", marketValueM: "200.00", dateOfBirth: "2000-07-21", heightCm: 194, weightKg: 88, preferredFoot: "Left", nationality: "Norway", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Erling+Haaland&background=random" },
    { name: "Kevin De Bruyne", position: "CAM", marketValueM: "60.00", dateOfBirth: "1991-06-28", heightCm: 181, weightKg: 70, preferredFoot: "Right", nationality: "Belgium", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Kevin+De+Bruyne&background=random" },
    { name: "Rodri", position: "CDM", marketValueM: "150.00", dateOfBirth: "1996-06-22", heightCm: 191, weightKg: 82, preferredFoot: "Right", nationality: "Spain", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Rodri&background=random" },
    { name: "Phil Foden", position: "CAM", marketValueM: "150.00", dateOfBirth: "2000-05-28", heightCm: 171, weightKg: 70, preferredFoot: "Left", nationality: "England", teamId: teamMap["Manchester City"].id, photoUrl: "https://ui-avatars.com/api/?name=Phil+Foden&background=random" },
    { name: "Mohamed Salah", position: "RW", marketValueM: "50.00", dateOfBirth: "1992-06-15", heightCm: 175, weightKg: 71, preferredFoot: "Left", nationality: "Egypt", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Mohamed+Salah&background=random" },
    { name: "Virgil van Dijk", position: "CB", marketValueM: "45.00", dateOfBirth: "1991-07-08", heightCm: 193, weightKg: 92, preferredFoot: "Right", nationality: "Netherlands", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Virgil+van+Dijk&background=random" },
    { name: "Trent Alexander-Arnold", position: "RB", marketValueM: "80.00", dateOfBirth: "1998-10-07", heightCm: 175, weightKg: 69, preferredFoot: "Right", nationality: "England", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Trent+Alexander-Arnold&background=random" },
    { name: "Alisson Becker", position: "GK", marketValueM: "50.00", dateOfBirth: "1992-10-02", heightCm: 191, weightKg: 91, preferredFoot: "Right", nationality: "Brazil", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Alisson+Becker&background=random" },
    { name: "Alexis Mac Allister", position: "CM", marketValueM: "80.00", dateOfBirth: "1998-12-24", heightCm: 174, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Liverpool"].id, photoUrl: "https://ui-avatars.com/api/?name=Alexis+Mac+Allister&background=random" },
    { name: "Harry Kane", position: "CF", marketValueM: "100.00", dateOfBirth: "1993-07-28", heightCm: 188, weightKg: 86, preferredFoot: "Right", nationality: "England", teamId: teamMap["Bayern Munich"].id, photoUrl: "https://ui-avatars.com/api/?name=Harry+Kane&background=random" },
    { name: "Jamal Musiala", position: "CAM", marketValueM: "150.00", dateOfBirth: "2003-02-26", heightCm: 180, weightKg: 70, preferredFoot: "Right", nationality: "Germany", teamId: teamMap["Bayern Munich"].id, photoUrl: "https://ui-avatars.com/api/?name=Jamal+Musiala&background=random" },
    { name: "Julian Alvarez", position: "CF", marketValueM: "90.00", dateOfBirth: "2000-01-31", heightCm: 170, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Atletico Madrid"].id, photoUrl: "https://ui-avatars.com/api/?name=Julian+Alvarez&background=random" },
    { name: "Emiliano Martinez", position: "GK", marketValueM: "40.00", dateOfBirth: "1992-09-02", heightCm: 195, weightKg: 88, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Aston Villa"].id, photoUrl: "https://ui-avatars.com/api/?name=Emiliano+Martinez&background=random" },
    { name: "Cristian Romero", position: "CB", marketValueM: "70.00", dateOfBirth: "1998-04-27", heightCm: 185, weightKg: 79, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Tottenham"].id, photoUrl: "https://ui-avatars.com/api/?name=Cristian+Romero&background=random" },
    { name: "Bukayo Saka", position: "RW", marketValueM: "150.00", dateOfBirth: "2001-09-05", heightCm: 178, weightKg: 72, preferredFoot: "Left", nationality: "England", teamId: teamMap["Arsenal"].id, photoUrl: "https://ui-avatars.com/api/?name=Bukayo+Saka&background=random" },
    { name: "Lamine Yamal", position: "RW", marketValueM: "180.00", dateOfBirth: "2007-07-13", heightCm: 176, weightKg: 65, preferredFoot: "Left", nationality: "Spain", teamId: teamMap["Barcelona"].id, photoUrl: "https://ui-avatars.com/api/?name=Lamine+Yamal&background=random" },
    { name: "Raphinha", position: "RW", marketValueM: "80.00", dateOfBirth: "1996-12-14", heightCm: 176, weightKg: 68, preferredFoot: "Left", nationality: "Brazil", teamId: teamMap["Barcelona"].id, photoUrl: "https://ui-avatars.com/api/?name=Raphinha&background=random" },
    { name: "Enzo Fernandez", position: "CM", marketValueM: "60.00", dateOfBirth: "2001-01-17", heightCm: 178, weightKg: 74, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Chelsea"].id, photoUrl: "https://ui-avatars.com/api/?name=Enzo+Fernandez&background=random" },
    { name: "Lautaro Martinez", position: "CF", marketValueM: "110.00", dateOfBirth: "1997-08-22", heightCm: 174, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Inter Milan"].id, photoUrl: "https://ui-avatars.com/api/?name=Lautaro+Martinez&background=random" },
  ];

  const insertedPlayers = await db.insert(players).values(playersData).returning();

  // ── 4. STATS Y RATINGS ─────────────────────────────────────────────────────
  const statsData: (typeof playerStats.$inferInsert)[] = [];
  const ratingsData: (typeof playerRatings.$inferInsert)[] = [];

  for (const player of insertedPlayers) {
    const base = BASE_STATS[player.position] ?? BASE_STATS["CM"];

    for (const season of insertedSeasons) {
      const matches = rnd(28, 38);
      const rating = parseFloat((base.sofascoreRating + rnd(-4, 4) / 10).toFixed(1));

      statsData.push({
        playerId: player.id,
        seasonId: season.id,
        matchesPlayed: matches,
        minutesPlayed: matches * rnd(70, 90),
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
  });

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
