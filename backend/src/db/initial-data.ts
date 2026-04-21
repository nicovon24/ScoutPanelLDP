// seed.ts — Liga Profesional Argentina · Apertura 2026
// ✅ ~55 jugadores verificados en el torneo (abril 2026)
// ✅ Fotos: 100% Fotmob (images.fotmob.com/image_resources/playerimages/{ID}.png)
// ✅ 5 River · 5 Boca · 5 Racing · 5 Independiente · 5 Belgrano · 5 Talleres · 5 Instituto
//    + jugadores de Huracán, San Lorenzo, Lanús, Defensa y Justicia, Estudiantes, etc.
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import {
  teams,
  seasons,
  players,
  playerStats,
  playerRatings,
  playerInjuries,
  playerCareer,
  users,
} from "./schema";
import bcrypt from "bcrypt";
import { buildCareerRows, type CareerStep } from "../helpers/career-generator";
import { TEAM_SEED_ROWS } from "./seed-data/teams.seed";
import { PLAYER_SEED_TEMPLATES } from "./seed-data/players.seed";
import { REAL_PLAYER_STATS } from "./seed-data/real-player-stats.seed";
import { BASE_POSITION_TEMPLATES } from "./seed-data/position-templates.seed";
import { INJURY_SEED } from "./seed-data/injuries.seed";
import {
  STRENGTH_BY_POS,
  WEAK_BY_POS,
  HEATMAP_ZONES,
  CONTRACT_DISTRIBUTION,
  type ContractKind,
} from "./seed-data/scout-traits.seed";
import type { RealPlayerSeasonStats, PositionStatTemplate } from "../types/seed";

/** Carreras hardcodeadas por nombre; si no hay entrada, `buildCareerRows` usa `generateCareer`. */
const CAREER_OVERRIDES: Record<string, CareerStep[]> = {};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── HELPERS ────────────────────────────────────────────────────────────────
const addDays = (d: string, n: number) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const rndI = (min: number, max: number) => Math.round(rnd(min, max));
const vary = (base: number, pct = 0.15) =>
  Math.max(0, base * (1 - pct + Math.random() * pct * 2)).toFixed(2);
const varyI = (base: number, pct = 0.15) =>
  Math.max(0, Math.round(base * (1 - pct + Math.random() * pct * 2)));

// Foto Fotmob: URL directa estable
const fm = (id: number) =>
  `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

type RS = RealPlayerSeasonStats;
type TPL = PositionStatTemplate;
const BASE_TPL: Record<string, TPL> = BASE_POSITION_TEMPLATES;
const INJTYPES = INJURY_SEED.injuryTypesByPosition;
const SEASON_START: Record<number, string> = {};
for (const y of Object.keys(INJURY_SEED.seasonStartDates)) {
  SEASON_START[Number(y)] = INJURY_SEED.seasonStartDates[y];
}

function genRS(tpl: TPL): RS {
  const mp = rndI(tpl.mpRange[0], tpl.mpRange[1]);
  return {
    mp, min: mp * rndI(70, 90),
    g: rndI(tpl.gRange[0], tpl.gRange[1]),
    a: rndI(tpl.aRange[0], tpl.aRange[1]),
    yc: rndI(1, 7), rc: Math.random() < .08 ? 1 : 0,
    rating: parseFloat(rnd(tpl.ratingR[0], tpl.ratingR[1]).toFixed(1)),
    xgB: tpl.xgB, shotB: tpl.shotB, shotOTB: tpl.shotOTB,
    xaB: tpl.xaB, kpB: tpl.kpB, passB: tpl.passB,
    tackB: tpl.tackB, intB: tpl.intB, recB: tpl.recB,
    aerB: tpl.aerB, dribB: tpl.dribB, dribRB: tpl.dribRB,
    saveB: tpl.saveB, csB: tpl.csB,
  };
}
/** Genera grilla 5×5 de heatmap a partir de las zonas definidas en scout-traits.seed.ts */
function heatmapForPosition(position: string): number[][] {
  const zones = HEATMAP_ZONES[position] ?? HEATMAP_ZONES["CM"];
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      let lo = 5, hi = 20;
      for (const z of zones) {
        if (r >= z.row[0] && r <= z.row[1] && c >= z.col[0] && c <= z.col[1]) {
          lo = z.lo; hi = z.hi; break;
        }
      }
      grid[r][c] = Math.min(100, rndI(lo, hi));
    }
  }
  return grid;
}

function pickUnique<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function scoutTraits(position: string) {
  const s = STRENGTH_BY_POS[position] ?? STRENGTH_BY_POS["CM"];
  const w = WEAK_BY_POS[position] ?? WEAK_BY_POS["CM"];
  return {
    strengths: pickUnique(s, rndI(3, 4)),
    weaknesses: pickUnique(w, rndI(2, 3)),
  };
}

function contractForIndex(i: number): { contractType: ContractKind; contractUntil: string } {
  const dist = CONTRACT_DISTRIBUTION[i % CONTRACT_DISTRIBUTION.length];
  if (dist.type === "FREE") {
    return { contractType: "FREE", contractUntil: addDays("2026-06-30", rndI(-90, 180)) };
  }
  if (dist.type === "LOAN") {
    return { contractType: "LOAN", contractUntil: addDays("2026-06-30", rndI(0, 120)) };
  }
  const y = 2026 + rndI(dist.yearsRange[0], dist.yearsRange[1]);
  return { contractType: "PERMANENT", contractUntil: `${y}-06-30` };
}

function buildStat(rs: RS, playerId: number, seasonId: number, mv: string, position: string) {
  const bigChances = Math.max(0, varyI(Math.round(rs.a * 2 + rs.g * 0.35 + rs.mp * 0.08)));
  const foulsDrawn = Math.max(0, varyI(rndI(position === "CF" || position === "LW" || position === "RW" ? 12 : 6, 48)));
  return {
    playerId, seasonId,
    matchesPlayed: rs.mp, minutesPlayed: rs.min,
    goals: rs.g, assists: rs.a, yellowCards: rs.yc, redCards: rs.rc,
    sofascoreRating: String(rs.rating), marketValueM: mv,
    xgPerGame: vary(rs.xgB), shotsPerGame: vary(rs.shotB),
    shotsOnTargetPct: vary(rs.shotOTB, .10),
    xaPerGame: vary(rs.xaB), keyPassesPerGame: vary(rs.kpB),
    passAccuracyPct: vary(rs.passB, .05),
    tackles: varyI(rs.tackB), interceptions: varyI(rs.intB),
    recoveries: varyI(rs.recB), aerialDuelsWonPct: vary(rs.aerB, .10),
    successfulDribblesPerGame: vary(rs.dribB), dribbleSuccessRate: vary(rs.dribRB, .10),
    bigChancesCreated: bigChances,
    foulsDrawn,
    heatmapData: heatmapForPosition(position),
    savePct: rs.saveB ? vary(rs.saveB, 0.08) : null,
    cleanSheets: rs.csB ? Math.round(rs.mp * (rs.csB + (Math.random() * 0.1 - 0.05))) : null,
    goalsConceded: rs.saveB ? Math.round(rs.mp * (0.8 + Math.random() * 0.6)) : null,
  };
}
function buildRating(rating: number, year: number, playerId: number, seasonId: number) {
  const months = year === 2026 ? ["01", "02", "03", "04"] : ["02", "03", "04", "05", "08", "09", "10", "11"];
  const rBM: Record<string, number> = {};
  months.forEach(m => {
    rBM[`${year}-${m}`] = parseFloat(
      Math.max(5, Math.min(10, rating + Math.random() * .6 - .3)).toFixed(1)
    );
  });
  return { playerId, seasonId, seasonRating: String(rating), ratingByMonth: rBM };
}
function maybeInjury(playerId: number, seasonId: number, year: number, pos: string) {
  const pool = INJTYPES[pos] ?? INJTYPES["CM"];
  if (Math.random() > (year === 2026 ? .20 : .35)) return null;
  const injuryType = pool[rndI(0, pool.length - 1)];
  const offset = rndI(10, 60);
  const dOut = injuryType.includes("Rotura ligamento") ? rndI(150, 270)
    : injuryType.includes("Desgarro") || injuryType.includes("Fractura") ? rndI(21, 55) : rndI(5, 20);
  const start = SEASON_START[year] ?? "2024-01-20";
  return {
    playerId, seasonId, injuryType,
    startedAt: addDays(start, offset),
    returnedAt: addDays(start, offset + dOut),
    daysOut: dOut,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹 Limpiando BD...");
  await db.execute(sql`
    TRUNCATE TABLE player_injuries, player_ratings, player_stats, player_career,
                   shortlist_entries, players, seasons, teams, users
    RESTART IDENTITY CASCADE
  `);

  console.log("🌱 Seed — Liga Profesional Argentina (Apertura 2026)...");

  // ── EQUIPOS ──────────────────────────────────────────────────────────────────
  const insertedTeams = await db.insert(teams).values([...TEAM_SEED_ROWS]).returning();

  const teamMap: Record<string, typeof insertedTeams[0]> = {};
  insertedTeams.forEach(t => { teamMap[t.name] = t; });

  // ── TEMPORADAS ────────────────────────────────────────────────────────────────
  const insertedSeasons = await db.insert(seasons).values([
    { name: "2023", year: 2023 }, { name: "2024", year: 2024 },
    { name: "2025", year: 2025 }, { name: "2026", year: 2026 },
  ]).returning();
  const seasonMap: Record<number, typeof insertedSeasons[0]> = {};
  insertedSeasons.forEach(s => { seasonMap[s.year] = s; });

  // ─────────────────────────────────────────────────────────────────────────────
  // JUGADORES — definición en seed-data/players.seed.ts (teamName + fotmobPlayerImageId)
  // ─────────────────────────────────────────────────────────────────────────────
  const allPlayersData = PLAYER_SEED_TEMPLATES.map((p, idx) => {
    const t = teamMap[p.teamName];
    if (!t) throw new Error(`Equipo desconocido: ${p.teamName}`);
    const traits = scoutTraits(p.position);
    const contract = contractForIndex(idx);
    return {
      name: p.name,
      position: p.position,
      marketValueM: p.marketValueM,
      dateOfBirth: p.dateOfBirth,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      preferredFoot: p.preferredFoot,
      nationality: p.nationality,
      teamId: t.id,
      debutYear: p.debutYear,
      photoUrl: fm(p.fotmobPlayerImageId),
      contractType: contract.contractType,
      contractUntil: contract.contractUntil,
      strengths: traits.strengths,
      weaknesses: traits.weaknesses,
    };
  });

  const insertedPlayers = await db.insert(players).values(allPlayersData).returning();

  // ── STATS + RATINGS + INJURIES ────────────────────────────────────────────
  const statsData: (typeof playerStats.$inferInsert)[] = [];
  const ratingsData: (typeof playerRatings.$inferInsert)[] = [];
  const injuriesData: (typeof playerInjuries.$inferInsert)[] = [];
  const careerData: (typeof playerCareer.$inferInsert)[] = [];

  for (const player of insertedPlayers) {
    const realMap = REAL_PLAYER_STATS[player.name];
    const tpl = BASE_TPL[player.position] ?? BASE_TPL["CM"];

    for (const season of insertedSeasons) {
      if (season.year < (player.debutYear ?? 2010)) continue;
      const rs: RS = realMap?.[String(season.year)] ?? genRS(tpl);
      statsData.push(
        buildStat(rs, player.id, season.id, player.marketValueM ?? "0", player.position),
      );
      ratingsData.push(buildRating(rs.rating, season.year, player.id, season.id));
      const inj = maybeInjury(player.id, season.id, season.year, player.position);
      if (inj) injuriesData.push(inj);
    }

    // ── CARRERA: usa hardcodeado si existe, si no genera automático ──────────
    const currentTeam = insertedTeams.find(t => t.id === player.teamId);

    const careerRows = buildCareerRows(
      player.id,
      {
        name: player.name,
        position: player.position,
        marketValueM: player.marketValueM ?? "0",
        debutYear: player.debutYear ?? 2018,
        nationality: player.nationality ?? "Argentina",
        currentTeamName: currentTeam?.name ?? "",
        currentTeamLogoUrl: currentTeam?.logoUrl ?? "",
      },
      CAREER_OVERRIDES[player.name],
    );

    careerData.push(...careerRows);
  }


  await db.insert(playerStats).values(statsData);
  await db.insert(playerRatings).values(ratingsData);
  if (injuriesData.length) await db.insert(playerInjuries).values(injuriesData);
  if (careerData.length) await db.insert(playerCareer).values(careerData);

  // ── USUARIO DEMO ──────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("123456", 10);
  await db.insert(users).values([
    { email: "demo@gmail.com", passwordHash: hash, name: "Scout Demo" },
    { email: "apiuser@gmail.com", passwordHash: hash, name: "API User" },
    { email: "productionuser@gmail.com", passwordHash: hash, name: "Production User" },
  ]).onConflictDoNothing();

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const byTeam: Record<string, number> = {};
  insertedPlayers.forEach(p => {
    const t = insertedTeams.find(t => t.id === p.teamId)?.name ?? "?";
    byTeam[t] = (byTeam[t] ?? 0) + 1;
  });
  console.log("✅ Seed completado:");
  console.log(`   ${insertedTeams.length}   equipos`);
  console.log(`   ${insertedSeasons.length}   temporadas`);
  console.log(`   ${insertedPlayers.length}  jugadores`);
  console.log(`   ${statsData.length}  registros player_stats`);
  console.log(`   ${ratingsData.length}  registros player_ratings`);
  console.log(`   ${injuriesData.length}  registros player_injuries`);
  console.log(`   ${careerData.length}  registros player_career`);
  /*Object.entries(byTeam).sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`   • ${t.padEnd(22)} ${n}`));*/

  await pool.end();
}

main().catch(err => {
  console.error("❌ Seed falló:", err);
  process.exit(1);
});