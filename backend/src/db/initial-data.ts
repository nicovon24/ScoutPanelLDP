// seed.ts — Liga Profesional Argentina 2026
// Equipos y jugadores actualizados a abril 2026

import * as dotenv from "dotenv";
import path from "path";

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
  2026: "2026-01-22",
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

  console.log("🌱 Iniciando seed V6 — Liga Profesional Argentina 2026...");

  // ── 1. EQUIPOS — 30 clubes de la Liga Profesional 2026 ────────────────────
  const insertedTeams = await db.insert(teams).values([
    // Grandes de Buenos Aires
    { name: "River Plate", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/ac/Club_Atl%C3%A9tico_River_Plate_crest.svg" },
    { name: "Boca Juniors", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/46/Boca_jrs_crest.svg" },
    { name: "Racing Club", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Racing_Club_de_Avellaneda_Logo.svg" },
    { name: "Independiente", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Club_Atletico_Independiente.svg" },
    { name: "San Lorenzo", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/27/San_Lorenzo_de_Almagro_logo.svg" },
    { name: "Huracán", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/11/Club_Atletico_Huracan.svg" },
    { name: "Vélez Sarsfield", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Escudo_del_Club_Atl%C3%A9tico_V%C3%A9lez_Sarsfieldsvg.svg" },
    { name: "Argentinos Juniors", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Argentinos_Juniors_logo.svg" },
    { name: "Platense", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/56/Club_Atletico_Platense.svg" },
    { name: "Barracas Central", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Barracas_Central_logo.svg" },
    { name: "Deportivo Riestra", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Deportivo_Riestra.svg" },
    // Gran Buenos Aires
    { name: "Banfield", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Club_Atletico_Banfield_escudo.svg" },
    { name: "Lanús", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Club_Atletico_Lanus.svg" },
    { name: "Defensa y Justicia", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Defensa_y_justicia_crest.svg" },
    { name: "Tigre", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/Club_Atletico_Tigre.svg" },
    { name: "Aldosivi", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Escudo_de_Club_Atl%C3%A9tico_Aldosivi.svg" },
    // La Plata
    { name: "Estudiantes (LP)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Estudiantes_de_La_Plata_logo.svg" },
    { name: "Gimnasia (LP)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Escudo_gimnasia_la_plata.svg" },
    // Rosario
    { name: "Rosario Central", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Rosario_Central_Logo.svg" },
    { name: "Newell's Old Boys", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/54/Newells_oldboys_logo.svg" },
    // Córdoba
    { name: "Talleres (C)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Escudo_Club_Atl%C3%A9tico_Talleres.svg" },
    { name: "Belgrano", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/13/Escudo_del_Club_Atl%C3%A9tico_Belgrano.svg" },
    { name: "Instituto", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Logotipo_del_Instituto_Atl%C3%A9tico_Central_C%C3%B3rdoba.svg" },
    // Interior del país
    { name: "Atlético Tucumán", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/63/Atletico_de_Tucuman.svg" },
    { name: "Central Córdoba (SdE)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/61/Central-cordoba-sde-logo.svg" },
    { name: "Unión (SF)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Club_Atletico_Union.svg" },
    { name: "Sarmiento (J)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Club_Atletico_Sarmiento_de_Junin.svg" },
    // Mendoza
    { name: "Independiente Rivadavia", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/Independiente_Rivadavia.svg" },
    { name: "Gimnasia (M)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/64/Gimnasia_y_Esgrima_de_Mendoza.svg" },
    // Ascendido
    { name: "Estudiantes (RC)", country: "Argentina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Estudiantes_de_Rio_Cuarto.svg" },
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

  // ── 3. JUGADORES — 30 figuras de la Liga Profesional Argentina 2026 ────────
  //
  // Fuentes: Transfermarkt (valores de mercado, 2025-2026), Sofascore,
  //          tabla de goleadores Apertura 2026, Yahoo/Canchallena.
  //
  const playersData = [
    // ── River Plate ──────────────────────────────────────────────────────────
    {
      name: "Franco Mastantuono", position: "CAM", marketValueM: "30.00",
      dateOfBirth: "2008-08-10", heightCm: 177, weightKg: 70,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["River Plate"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Franco+Mastantuono&background=random",
      debutYear: 2024,
      // La joya del fútbol argentino: record Transfermarkt local (30 M€ en 2025),
      // debutó con 15 años, ya en Selección Argentina mayor.
    },
    {
      name: "Pablo Solari", position: "LW", marketValueM: "7.00",
      dateOfBirth: "2001-10-18", heightCm: 180, weightKg: 75,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["River Plate"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Pablo+Solari&background=random",
      debutYear: 2021,
    },
    {
      name: "Lucas Martínez Quarta", position: "CB", marketValueM: "9.00",
      dateOfBirth: "1996-05-10", heightCm: 183, weightKg: 79,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["River Plate"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Lucas+Martinez+Quarta&background=random",
      debutYear: 2016,
    },
    {
      name: "Kevin Castaño", position: "CDM", marketValueM: "8.00",
      dateOfBirth: "1998-11-11", heightCm: 180, weightKg: 76,
      preferredFoot: "Right", nationality: "Colombia",
      teamId: teamMap["River Plate"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Kevin+Castano&background=random",
      debutYear: 2019,
    },

    // ── Boca Juniors ─────────────────────────────────────────────────────────
    {
      name: "Kevin Zenón", position: "CAM", marketValueM: "9.00",
      dateOfBirth: "2002-02-26", heightCm: 175, weightKg: 68,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Boca Juniors"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Kevin+Zenon&background=random",
      debutYear: 2021,
    },
    {
      name: "Cristian Medina", position: "CM", marketValueM: "8.00",
      dateOfBirth: "2001-06-18", heightCm: 178, weightKg: 72,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Boca Juniors"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Cristian+Medina&background=random",
      debutYear: 2020,
    },
    {
      name: "Aaron Anselmino", position: "CB", marketValueM: "8.00",
      dateOfBirth: "2004-04-02", heightCm: 191, weightKg: 82,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Boca Juniors"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Aaron+Anselmino&background=random",
      debutYear: 2023,
    },
    {
      name: "Miguel Merentiel", position: "CF", marketValueM: "7.00",
      dateOfBirth: "1997-06-05", heightCm: 188, weightKg: 80,
      preferredFoot: "Right", nationality: "Uruguay",
      teamId: teamMap["Boca Juniors"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Miguel+Merentiel&background=random",
      debutYear: 2017,
    },

    // ── Racing Club ──────────────────────────────────────────────────────────
    {
      name: "Juan Ignacio Nardoni", position: "CM", marketValueM: "11.00",
      dateOfBirth: "2002-05-21", heightCm: 183, weightKg: 78,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Racing Club"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Juan+Nardoni&background=random",
      debutYear: 2021,
      // Box-to-box, 3er valor TM en Argentina. Cotizado en Europa.
    },
    {
      name: "Marco Di Césare", position: "CB", marketValueM: "9.00",
      dateOfBirth: "2001-09-18", heightCm: 188, weightKg: 82,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Racing Club"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Marco+Di+Cesare&background=random",
      debutYear: 2021,
    },
    {
      name: "Santiago Sosa", position: "CDM", marketValueM: "8.00",
      dateOfBirth: "1998-08-25", heightCm: 182, weightKg: 78,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Racing Club"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Santiago+Sosa&background=random",
      debutYear: 2017,
    },

    // ── Independiente ────────────────────────────────────────────────────────
    {
      name: "Kevin Lomónaco", position: "CB", marketValueM: "12.00",
      dateOfBirth: "2001-11-28", heightCm: 187, weightKg: 81,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Independiente"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Kevin+Lomonaco&background=random",
      debutYear: 2021,
      // 2do valor TM en Argentina. Apodado "Cumbia". Convocado a Selección.
    },
    {
      name: "Felipe Loyola", position: "LW", marketValueM: "9.00",
      dateOfBirth: "2000-09-22", heightCm: 174, weightKg: 68,
      preferredFoot: "Left", nationality: "Chile",
      teamId: teamMap["Independiente"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Felipe+Loyola&background=random",
      debutYear: 2019,
    },

    // ── Vélez Sarsfield ──────────────────────────────────────────────────────
    {
      name: "Valentín Gómez", position: "CB", marketValueM: "10.00",
      dateOfBirth: "2003-06-06", heightCm: 186, weightKg: 80,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Vélez Sarsfield"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Valentin+Gomez&background=random",
      debutYear: 2022,
    },
    {
      name: "Maher Carrizo", position: "RW", marketValueM: "6.00",
      dateOfBirth: "2005-03-14", heightCm: 172, weightKg: 67,
      preferredFoot: "Left", nationality: "Argentina",
      teamId: teamMap["Vélez Sarsfield"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Maher+Carrizo&background=random",
      debutYear: 2023,
    },

    // ── Estudiantes (LP) ─────────────────────────────────────────────────────
    {
      name: "Cristian Medina (Est.)", position: "CM", marketValueM: "8.00",
      // Nota: jugador distinto al Cristian Medina de Boca; mismo nombre, diferente club.
      // En producción considera renombrar uno de los dos para evitar conflictos de UI.
      dateOfBirth: "2000-03-01", heightCm: 176, weightKg: 71,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Estudiantes (LP)"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Cristian+Medina+Estudiantes&background=random",
      debutYear: 2019,
    },

    // ── Huracán ──────────────────────────────────────────────────────────────
    {
      name: "Jordy Caicedo", position: "CF", marketValueM: "3.50",
      dateOfBirth: "1995-03-13", heightCm: 182, weightKg: 78,
      preferredFoot: "Right", nationality: "Ecuador",
      teamId: teamMap["Huracán"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Jordy+Caicedo&background=random",
      debutYear: 2014,
      // Líder de goleadores del Apertura 2026 (hasta fecha 4).
    },

    // ── Tigre ────────────────────────────────────────────────────────────────
    {
      name: "José David Romero", position: "CF", marketValueM: "3.00",
      dateOfBirth: "2003-07-14", heightCm: 180, weightKg: 74,
      preferredFoot: "Right", nationality: "Colombia",
      teamId: teamMap["Tigre"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Jose+David+Romero&background=random",
      debutYear: 2022,
      // 5 goles en 8 fechas del Apertura 2026. Gran revelación del torneo.
    },

    // ── Lanús ────────────────────────────────────────────────────────────────
    {
      name: "Julio Soler", position: "CM", marketValueM: "8.00",
      dateOfBirth: "2001-10-05", heightCm: 179, weightKg: 73,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Lanús"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Julio+Soler&background=random",
      debutYear: 2020,
    },

    // ── Argentinos Juniors ───────────────────────────────────────────────────
    {
      name: "Alan Lescano", position: "CAM", marketValueM: "7.50",
      dateOfBirth: "2002-01-22", heightCm: 175, weightKg: 69,
      preferredFoot: "Left", nationality: "Argentina",
      teamId: teamMap["Argentinos Juniors"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Alan+Lescano&background=random",
      debutYear: 2021,
    },

    // ── Rosario Central ──────────────────────────────────────────────────────
    {
      name: "Ignacio Malcorra", position: "CM", marketValueM: "4.00",
      dateOfBirth: "1993-12-07", heightCm: 183, weightKg: 77,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Rosario Central"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Ignacio+Malcorra&background=random",
      debutYear: 2013,
    },

    // ── Newell's Old Boys ────────────────────────────────────────────────────
    {
      name: "Tomás Pérez", position: "CM", marketValueM: "3.50",
      dateOfBirth: "1998-02-28", heightCm: 176, weightKg: 70,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Newell's Old Boys"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Tomas+Perez&background=random",
      debutYear: 2017,
    },

    // ── Talleres (C) — Córdoba ───────────────────────────────────────────────
    {
      name: "Rodrigo Villagra", position: "CDM", marketValueM: "5.00",
      dateOfBirth: "1998-10-27", heightCm: 186, weightKg: 80,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Talleres (C)"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Rodrigo+Villagra&background=random",
      debutYear: 2018,
    },
    {
      name: "Gastón Benavídez", position: "CF", marketValueM: "2.50",
      dateOfBirth: "1996-04-19", heightCm: 181, weightKg: 76,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Talleres (C)"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Gaston+Benavidez&background=random",
      debutYear: 2016,
    },

    // ── Belgrano — Córdoba ───────────────────────────────────────────────────
    {
      name: "Lucas Zelarayan", position: "CAM", marketValueM: "4.00",
      dateOfBirth: "1992-06-20", heightCm: 178, weightKg: 73,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Belgrano"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Lucas+Zelarayan&background=random",
      debutYear: 2011,
    },

    // ── Instituto — Córdoba ──────────────────────────────────────────────────
    {
      name: "Diego Valoyes", position: "LW", marketValueM: "2.50",
      dateOfBirth: "1995-05-12", heightCm: 175, weightKg: 71,
      preferredFoot: "Right", nationality: "Colombia",
      teamId: teamMap["Instituto"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Diego+Valoyes&background=random",
      debutYear: 2016,
    },

    // ── Atlético Tucumán ─────────────────────────────────────────────────────
    {
      name: "Ramiro Ruiz Rodríguez", position: "RW", marketValueM: "3.00",
      dateOfBirth: "1998-11-22", heightCm: 172, weightKg: 68,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Atlético Tucumán"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Ramiro+Ruiz+Rodriguez&background=random",
      debutYear: 2018,
    },

    // ── Unión (SF) ───────────────────────────────────────────────────────────
    {
      name: "Nicolás Paz", position: "CM", marketValueM: "4.00",
      dateOfBirth: "2004-01-15", heightCm: 176, weightKg: 68,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Unión (SF)"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Nicolas+Paz&background=random",
      debutYear: 2023,
    },

    // ── Defensa y Justicia ───────────────────────────────────────────────────
    {
      name: "Matías Rojas", position: "CAM", marketValueM: "5.00",
      dateOfBirth: "1997-07-22", heightCm: 176, weightKg: 71,
      preferredFoot: "Right", nationality: "Paraguay",
      teamId: teamMap["Defensa y Justicia"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Matias+Rojas&background=random",
      debutYear: 2017,
    },

    // ── Platense ─────────────────────────────────────────────────────────────
    {
      name: "Gastón Hernández", position: "CM", marketValueM: "3.50",
      dateOfBirth: "1999-03-19", heightCm: 177, weightKg: 72,
      preferredFoot: "Right", nationality: "Argentina",
      teamId: teamMap["Platense"].id,
      photoUrl: "https://ui-avatars.com/api/?name=Gaston+Hernandez&background=random",
      debutYear: 2019,
    },
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

      // Valor de mercado dinámico por edad y rendimiento
      const birthYear = new Date(player.dateOfBirth!).getFullYear();
      const age = season.year - birthYear;
      let currentVal = parseFloat(player.marketValueM ?? "0");

      if (season.year > 2024) {
        if (age < 23) {
          currentVal *= (rating > 7.0 ? 1.30 : 1.05);
        } else if (age < 30) {
          currentVal *= (rating > 7.2 ? 1.15 : 0.95);
        } else if (age < 34) {
          currentVal *= (rating > 7.4 ? 1.05 : 0.85);
        } else {
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
  const passwordHash = await bcrypt.hash("123456", 10);
  await db.insert(users).values({
    email: "demo@gmail.com",
    passwordHash,
    name: "Scout Demo",
  }).onConflictDoNothing();

  console.log("✅ Seed V6 completado:");
  console.log(`   ${insertedTeams.length}  equipos (Liga Profesional Argentina 2026)`);
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