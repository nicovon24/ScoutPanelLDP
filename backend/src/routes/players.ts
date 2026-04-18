import { Router } from "express";
import { db } from "../db";
import { players, playerStats, playerRatings, playerInjuries, teams, seasons } from "../db/schema";
import { eq, and, gte, lte, sql, inArray, or, ilike, desc, asc } from "drizzle-orm";

const router = Router();

// ─── GET /api/players/search  (MUST be before /:id) ────────────────────────
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) return res.json({ players: [], teams: [] });

    const pattern = `%${q}%`;

    const matchingPlayers = await db
      .select({
        id: players.id,
        name: players.name,
        position: players.position,
        nationality: players.nationality,
        photoUrl: players.photoUrl,
        marketValueM: players.marketValueM,
      })
      .from(players)
      .where(or(ilike(players.name, pattern), ilike(players.nationality, pattern)))
      .limit(8);

    const matchingTeams = await db
      .select({ id: teams.id, name: teams.name, country: teams.country, logoUrl: teams.logoUrl })
      .from(teams)
      .where(or(ilike(teams.name, pattern), ilike(teams.country, pattern)))
      .limit(4);

    res.json({ players: matchingPlayers, teams: matchingTeams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/players/compare  (MUST be before /:id) ───────────────────────
router.get("/compare", async (req, res) => {
  try {
    const { ids, seasonId } = req.query;
    if (!ids) return res.status(400).json({ error: "ids is required" });

    const playerIds = (ids as string).split(",").map(Number);

    let sid: number;
    if (seasonId) {
      sid = Number(seasonId);
    } else {
      const latestSeason = await db.query.seasons.findFirst({
        orderBy: (s, { desc }) => [desc(s.year)],
      });
      if (!latestSeason) return res.status(404).json({ error: "No seasons found" });
      sid = latestSeason.id;
    }

    const data = await db.query.players.findMany({
      where: inArray(players.id, playerIds),
      with: {
        team: true,
        stats: { where: eq(playerStats.seasonId, sid), with: { season: true } },
        ratings: { where: eq(playerRatings.seasonId, sid) },
        injuries: true,
      },
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/players  - List with filters + sorting ───────────────────────
router.get("/", async (req, res) => {
  try {
    const {
      position, nationality, teamId, foot,
      ageMin, ageMax,
      valueMin, valueMax,
      heightMin, heightMax, minRating,
      q,
      page = "1", limit = "20",
    } = req.query;

    const {
      sortBy = "rating_desc",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const conditions: ReturnType<typeof eq>[] = [];

    if (q) {
      const pattern = `%${(q as string).trim()}%`;
      conditions.push(ilike(players.name, pattern) as any);
    }
    if (position) {
      const posArr = (position as string).split(",");
      if (posArr.length > 1) {
        conditions.push(inArray(players.position, posArr) as any);
      } else {
        conditions.push(eq(players.position, position as string) as any);
      }
    }
    if (nationality) conditions.push(eq(players.nationality, nationality as string) as any);
    if (teamId) conditions.push(eq(players.teamId, Number(teamId)) as any);
    if (foot) conditions.push(eq(players.preferredFoot, foot as string) as any);

    if (valueMin) conditions.push(gte(players.marketValueM, valueMin as string) as any);
    if (valueMax) conditions.push(lte(players.marketValueM, valueMax as string) as any);
    if (heightMin) conditions.push(gte(players.heightCm, Number(heightMin)) as any);
    if (heightMax) conditions.push(lte(players.heightCm, Number(heightMax)) as any);

    // Age filters
    if (ageMin || ageMax) {
      const now = new Date();
      if (ageMin) {
        const minDate = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate());
        conditions.push(lte(players.dateOfBirth, minDate.toISOString().split("T")[0]) as any);
      }
      if (ageMax) {
        const maxDate = new Date(now.getFullYear() - Number(ageMax) - 1, now.getMonth(), now.getDate());
        conditions.push(gte(players.dateOfBirth, maxDate.toISOString().split("T")[0]) as any);
      }
    }

    const where = conditions.length > 0 ? and(...(conditions as any)) : undefined;

    // Get latest season
    const latestSeason = await db.query.seasons.findFirst({
      orderBy: (s, { desc }) => [desc(s.year)],
    });
    const sid = latestSeason?.id;

    // Build sort order for SQL
    let orderByClause: string;
    switch (sortBy) {
      case "name_asc": orderByClause = "p.name ASC"; break;
      case "name_desc": orderByClause = "p.name DESC"; break;
      case "age_asc": orderByClause = "p.date_of_birth DESC"; break;
      case "age_desc": orderByClause = "p.date_of_birth ASC"; break;
      case "value_asc": orderByClause = "p.market_value_m ASC NULLS LAST"; break;
      case "value_desc": orderByClause = "p.market_value_m DESC NULLS LAST"; break;
      case "rating_asc": orderByClause = "COALESCE(ps.sofascore_rating, 0) ASC"; break;
      default: orderByClause = "COALESCE(ps.sofascore_rating, 0) DESC"; break;
    }

    // We need a raw SQL query to sort by stats fields
    const needsStatsSort = ["goals_desc", "assists_desc", "rating_desc", "rating_asc"].includes(sortBy as string);

    if (needsStatsSort || sid) {
      // Use raw SQL join for sorting by stats
      const whereClauses: string[] = [];
      const vals: any[] = [];
      let idx = 1;

      if (q) { whereClauses.push(`p.name ILIKE $${idx++}`); vals.push(`%${(q as string).trim()}%`); }
      if (position) {
        const posArr = (position as string).split(",");
        if (posArr.length > 1) {
          whereClauses.push(`p.position = ANY($${idx++})`);
          vals.push(posArr);
        } else {
          whereClauses.push(`p.position = $${idx++}`);
          vals.push(position);
        }
      }
      if (nationality) { whereClauses.push(`p.nationality = $${idx++}`); vals.push(nationality); }
      if (teamId) { whereClauses.push(`p.team_id = $${idx++}`); vals.push(Number(teamId)); }
      if (foot) { whereClauses.push(`p.preferred_foot = $${idx++}`); vals.push(foot); }
      if (valueMin) { whereClauses.push(`p.market_value_m >= $${idx++}`); vals.push(Number(valueMin)); }
      if (valueMax) { whereClauses.push(`p.market_value_m <= $${idx++}`); vals.push(Number(valueMax)); }

      // Age
      if (ageMin) {
        const now = new Date();
        const minDate = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate());
        whereClauses.push(`p.date_of_birth <= $${idx++}`);
        vals.push(minDate.toISOString().split("T")[0]);
      }
      if (ageMax) {
        const now = new Date();
        const maxDate = new Date(now.getFullYear() - Number(ageMax) - 1, now.getMonth(), now.getDate());
        whereClauses.push(`p.date_of_birth >= $${idx++}`);
        vals.push(maxDate.toISOString().split("T")[0]);
      }

      if (heightMin) { whereClauses.push(`p.height_cm >= $${idx++}`); vals.push(Number(heightMin)); }
      if (heightMax) { whereClauses.push(`p.height_cm <= $${idx++}`); vals.push(Number(heightMax)); }
      if (minRating) { whereClauses.push(`ps.sofascore_rating >= $${idx++}`); vals.push(Number(minRating)); }

      const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const sidVal = sid ?? 0;

      const rawQuery = `
        SELECT
          p.id, p.name, p.position, p.nationality, p.date_of_birth AS "dateOfBirth",
          p.photo_url AS "photoUrl", p.market_value_m AS "marketValueM",
           p.preferred_foot AS "preferredFoot", p.height_cm AS "heightCm",
          p.weight_kg AS "weightKg", p.debut_year AS "debutYear",
          p.team_id AS "teamId",
          t.name AS "teamName", t.logo_url AS "teamLogoUrl",
          ps.sofascore_rating AS "sofascoreRating",
          ps.goals, ps.assists, ps.matches_played AS "matchesPlayed",
          ps.tackles, ps.interceptions, ps.clean_sheets AS "cleanSheets",
          ps.save_pct AS "savePct", ps.pass_accuracy_pct AS "passAccuracyPct",
          ps.xg_per_game AS "xgPerGame", ps.xa_per_game AS "xaPerGame"
        FROM players p
        LEFT JOIN teams t ON t.id = p.team_id
        LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}
        ${whereStr}
        ORDER BY ${orderByClause}, p.id ASC
        LIMIT $${idx++} OFFSET $${idx++}
      `;
      vals.push(Number(limit), offset);

      const { pool } = await import("../db");
      const { rows } = await pool.query(rawQuery, vals);

      const result = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        position: r.position,
        nationality: r.nationality,
        dateOfBirth: r.dateOfBirth,
        photoUrl: r.photoUrl,
        marketValueM: r.marketValueM,
        preferredFoot: r.preferredFoot,
        heightCm: r.heightCm,
        weightKg: r.weightKg,
        debutYear: r.debutYear,
        team: r.teamName ? { id: r.teamId, name: r.teamName, logoUrl: r.teamLogoUrl } : null,
        stats: r.sofascoreRating != null ? [{
          sofascoreRating: r.sofascoreRating,
          goals: r.goals,
          assists: r.assists,
          matchesPlayed: r.matchesPlayed,
          tackles: r.tackles,
          interceptions: r.interceptions,
          cleanSheets: r.cleanSheets,
          savePct: r.savePct,
          passAccuracyPct: r.passAccuracyPct,
          xgPerGame: r.xgPerGame,
          xaPerGame: r.xaPerGame,
        }] : [],
      }));

      return res.json(result);
    }

    // Simple query without stats sort
    const data = await db.query.players.findMany({
      where,
      limit: Number(limit),
      offset,
      with: { team: true },
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/players/:id ───────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const player = await db.query.players.findFirst({
      where: eq(players.id, id),
      with: {
        team: true,
        stats: { with: { season: true } },
        ratings: true,
        injuries: true,
      },
    });

    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
