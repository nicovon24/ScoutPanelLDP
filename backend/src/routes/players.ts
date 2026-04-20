import { Router, Request, Response } from "express";
import { db, pool } from "../db";
import { players, playerStats, playerRatings, teams } from "../db/schema";
import { eq, inArray, or, ilike, asc } from "drizzle-orm";

type SqlParam = string | number | boolean | string[] | number[];

const router = Router();

// ─── GET /api/players/nationalities  (distinct list for filter section) ────────────
router.get("/nationalities", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT nationality FROM players WHERE nationality IS NOT NULL AND nationality <> '' ORDER BY nationality ASC`
    );
    const list = result.rows.map((r: { nationality: string }) => r.nationality);
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── GET /api/players/search  (MUST be before /:id) ────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim() || "";

    if (q === "") {
      const defaultPlayers = await db
        .select({
          id: players.id,
          name: players.name,
          position: players.position,
          nationality: players.nationality,
          photoUrl: players.photoUrl,
        })
        .from(players)
        .orderBy(asc(players.name))
        .limit(20);
      return res.json({ players: defaultPlayers, teams: [] });
    }

    if (q.length < 2) return res.json({ players: [], teams: [] });

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
      .leftJoin(teams, eq(players.teamId, teams.id))
      .where(
        or(
          ilike(players.name, pattern),
          ilike(players.nationality, pattern),
          ilike(players.position, pattern),
          ilike(teams.name, pattern)
        )
      )
      .limit(8);

    const matchingTeams = await db
      .select({ id: teams.id, name: teams.name, country: teams.country, logoUrl: teams.logoUrl })
      .from(teams)
      .where(or(ilike(teams.name, pattern), ilike(teams.country, pattern)))
      .limit(4);

    res.json({ players: matchingPlayers, teams: matchingTeams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── GET /api/players/compare  (MUST be before /:id) ───────────────────────
router.get("/compare", async (req: Request, res: Response) => {
  try {
    const { ids, seasonId } = req.query;
    if (!ids) return res.status(400).json({ error: "El parámetro ids es requerido" });

    // Filtrar IDs inválidos (NaN), deduplicar y limitar cantidad
    const playerIds = [...new Set(
      (ids as string)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0)
    )];

    if (playerIds.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron IDs válidos" });
    }
    if (playerIds.length > 10) {
      return res.status(400).json({ error: "Máximo 10 jugadores por comparación" });
    }

    // F-06: validar seasonId
    let sid: number;
    if (seasonId) {
      sid = parseInt(seasonId as string, 10);
      if (isNaN(sid)) {
        return res.status(400).json({ error: "seasonId debe ser un entero válido" });
      }
    } else {
      const latestSeason = await db.query.seasons.findFirst({
        orderBy: (s, { desc }) => [desc(s.year)],
      });
      if (!latestSeason) return res.status(404).json({ error: "No se encontraron temporadas" });
      sid = latestSeason.id;
    }

    const data = await db.query.players.findMany({
      where: inArray(players.id, playerIds),
      with: {
        team: true,
        stats: { where: eq(playerStats.seasonId, sid), with: { season: true } },
        ratings: { where: eq(playerRatings.seasonId, sid) },
        injuries: true,
        career: true,
      },
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/players  — List with filters + sorting ───────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      position, nationality, contractType, teamId, foot,
      ageMin, ageMax,
      valueMin, valueMax,
      heightMin, heightMax, minRating,
      q,
      page = "1", limit = "20",
      sortBy = "rating_desc",
    } = req.query;

    // F-03 + F-18: validar y acotar page y limit
    const rawPage  = Math.max(1, parseInt(page as string, 10) || 1);
    const rawLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset   = (rawPage - 1) * rawLimit;

    // Build sort order — whitelist prevents SQL injection
    const ORDER_MAP: Record<string, string> = {
      name_asc:    "p.name ASC",
      name_desc:   "p.name DESC",
      age_asc:     "p.date_of_birth DESC",
      age_desc:    "p.date_of_birth ASC",
      value_asc:   "p.market_value_m ASC NULLS LAST",
      value_desc:  "p.market_value_m DESC NULLS LAST",
      rating_asc:  "COALESCE(ps.sofascore_rating, 0) ASC",
      rating_desc: "COALESCE(ps.sofascore_rating, 0) DESC",
    };
    const orderByClause = ORDER_MAP[sortBy as string] ?? ORDER_MAP["rating_desc"];

    // Get latest season
    const latestSeason = await db.query.seasons.findFirst({
      orderBy: (s, { desc }) => [desc(s.year)],
    });
    const sidVal = latestSeason?.id ?? 0;

    // Build parameterized WHERE clauses
    const whereClauses: string[] = [];
    const vals: SqlParam[] = [];
    let idx = 1;

    if (q) {
      whereClauses.push(`p.name ILIKE $${idx++}`);
      vals.push(`%${(q as string).trim()}%`);
    }
    if (position && position !== "") {
      const posArr = (position as string).split(",").filter(Boolean);
      if (posArr.length > 1) {
        whereClauses.push(`p.position = ANY($${idx++})`);
        vals.push(posArr);
      } else if (posArr.length === 1) {
        whereClauses.push(`p.position = $${idx++}`);
        vals.push(posArr[0]);
      }
    }
    if (nationality) {
      whereClauses.push(`p.nationality = $${idx++}`);
      vals.push(nationality as string);
    }
    if (contractType && contractType !== "") {
      const validTypes = ["PERMANENT", "LOAN", "FREE"];
      const ctArr = (contractType as string).split(",").filter((t) => validTypes.includes(t));
      if (ctArr.length > 1) {
        whereClauses.push(`p.contract_type = ANY($${idx++})`);
        vals.push(ctArr);
      } else if (ctArr.length === 1) {
        whereClauses.push(`p.contract_type = $${idx++}`);
        vals.push(ctArr[0]);
      }
    }
    if (teamId && teamId !== "") {
      // F-19: filtrar NaN de teamId
      const teamArr = (teamId as string)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (teamArr.length > 1) {
        whereClauses.push(`p.team_id = ANY($${idx++})`);
        vals.push(teamArr);
      } else if (teamArr.length === 1) {
        whereClauses.push(`p.team_id = $${idx++}`);
        vals.push(teamArr[0]);
      }
    }
    const VALID_FOOT = ["left", "right", "both"] as const;
    if (foot && VALID_FOOT.includes((foot as string).toLowerCase() as typeof VALID_FOOT[number])) {
      whereClauses.push(`LOWER(p.preferred_foot) = $${idx++}`);
      vals.push((foot as string).toLowerCase());
    }

    const safeNum = (v: unknown): number | null => {
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const vMin = safeNum(valueMin);
    if (vMin !== null) { whereClauses.push(`p.market_value_m >= $${idx++}`); vals.push(vMin); }

    const vMax = safeNum(valueMax);
    if (vMax !== null) { whereClauses.push(`p.market_value_m <= $${idx++}`); vals.push(vMax); }

    const aMin = safeNum(ageMin);
    if (aMin !== null) {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - aMin, now.getMonth(), now.getDate());
      whereClauses.push(`p.date_of_birth <= $${idx++}`);
      vals.push(minDate.toISOString().split("T")[0]);
    }

    const aMax = safeNum(ageMax);
    if (aMax !== null) {
      const now = new Date();
      const maxDate = new Date(now.getFullYear() - aMax - 1, now.getMonth(), now.getDate());
      whereClauses.push(`p.date_of_birth >= $${idx++}`);
      vals.push(maxDate.toISOString().split("T")[0]);
    }

    const hMin = safeNum(heightMin);
    if (hMin !== null) { whereClauses.push(`p.height_cm >= $${idx++}`); vals.push(hMin); }

    const hMax = safeNum(heightMax);
    if (hMax !== null) { whereClauses.push(`p.height_cm <= $${idx++}`); vals.push(hMax); }

    const mRating = safeNum(minRating);
    if (mRating !== null) { whereClauses.push(`ps.sofascore_rating >= $${idx++}`); vals.push(mRating); }

    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const rawQuery = `
      SELECT
        p.id, p.name, p.position, p.nationality, p.date_of_birth AS "dateOfBirth",
        p.photo_url AS "photoUrl", p.market_value_m AS "marketValueM",
        p.preferred_foot AS "preferredFoot", p.height_cm AS "heightCm",
        p.weight_kg AS "weightKg", p.debut_year AS "debutYear",
        p.contract_type AS "contractType", p.contract_until AS "contractUntil",
        p.team_id AS "teamId",
        t.name AS "teamName", t.logo_url AS "teamLogoUrl",
        ps.sofascore_rating AS "sofascoreRating",
        ps.goals, ps.assists, ps.matches_played AS "matchesPlayed",
        ps.tackles, ps.interceptions, ps.clean_sheets AS "cleanSheets",
        ps.save_pct AS "savePct", ps.pass_accuracy_pct AS "passAccuracyPct",
        ps.xg_per_game AS "xgPerGame", ps.xa_per_game AS "xaPerGame",
        ps.recoveries
      FROM players p
      LEFT JOIN teams t ON t.id = p.team_id
      LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}
      ${whereStr}
      ORDER BY ${orderByClause}, p.id ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM players p
      LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = ${sidVal}
      ${whereStr}
    `;

    const dataVals = [...vals, rawLimit, offset];

    const [dataRes, countRes] = await Promise.all([
      pool.query(rawQuery, dataVals),
      pool.query(countQuery, vals),
    ]);

    const totalItems = parseInt(countRes.rows[0].count);
    const items = (dataRes.rows as Record<string, unknown>[]).map((r) => ({
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
      contractType: r.contractType,
      contractUntil: r.contractUntil,
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
        recoveries: r.recoveries,
      }] : [],
    }));

    return res.json({ items, totalItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── GET /api/players/:id ───────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const player = await db.query.players.findFirst({
      where: eq(players.id, id),
      with: {
        team: true,
        stats: { with: { season: true } },
        ratings: true,
        injuries: true,
        career: true,
      },
    });

    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
