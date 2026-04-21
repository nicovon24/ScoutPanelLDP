import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db";

const router = Router();

// ── Whitelist de métricas válidas ─────────────────────────────────────────────
type MetricDef = {
  select: string;
  order: string;
  dir: "DESC" | "ASC";
};

const METRIC_MAP: Record<string, MetricDef> = {
  goals:             { select: "SUM(ps.goals)::int",                                    order: "SUM(ps.goals)",                            dir: "DESC" },
  assists:           { select: "SUM(ps.assists)::int",                                  order: "SUM(ps.assists)",                          dir: "DESC" },
  combined:          { select: "(SUM(ps.goals) + SUM(ps.assists))::int",                order: "SUM(ps.goals) + SUM(ps.assists)",          dir: "DESC" },
  rating:            { select: "ROUND(AVG(ps.sofascore_rating::numeric), 1)",           order: "AVG(ps.sofascore_rating::numeric)",        dir: "DESC" },
  minutesPlayed:     { select: "SUM(ps.minutes_played)::int",                           order: "SUM(ps.minutes_played)",                  dir: "DESC" },
  tackles:           { select: "SUM(ps.tackles)::int",                                  order: "SUM(ps.tackles)",                         dir: "DESC" },
  interceptions:     { select: "SUM(ps.interceptions)::int",                            order: "SUM(ps.interceptions)",                   dir: "DESC" },
  recoveries:        { select: "SUM(ps.recoveries)::int",                               order: "SUM(ps.recoveries)",                      dir: "DESC" },
  aerialDuelsWonPct: { select: "ROUND(AVG(ps.aerial_duels_won_pct::numeric), 1)",       order: "AVG(ps.aerial_duels_won_pct::numeric)",   dir: "DESC" },
  keyPassesPerGame:  { select: "ROUND(AVG(ps.key_passes_per_game::numeric), 2)",        order: "AVG(ps.key_passes_per_game::numeric)",    dir: "DESC" },
  passAccuracyPct:   { select: "ROUND(AVG(ps.pass_accuracy_pct::numeric), 1)",          order: "AVG(ps.pass_accuracy_pct::numeric)",      dir: "DESC" },
  xgPerGame:         { select: "ROUND(AVG(ps.xg_per_game::numeric), 2)",                order: "AVG(ps.xg_per_game::numeric)",            dir: "DESC" },
  xaPerGame:         { select: "ROUND(AVG(ps.xa_per_game::numeric), 2)",                order: "AVG(ps.xa_per_game::numeric)",            dir: "DESC" },
  shotsOnTargetPct:  { select: "ROUND(AVG(ps.shots_on_target_pct::numeric), 1)",        order: "AVG(ps.shots_on_target_pct::numeric)",    dir: "DESC" },
  savePct:           { select: "ROUND(AVG(ps.save_pct::numeric), 1)",                   order: "AVG(ps.save_pct::numeric)",               dir: "DESC" },
  cleanSheets:       { select: "SUM(ps.clean_sheets)::int",                             order: "SUM(ps.clean_sheets)",                    dir: "DESC" },
  goalsConceded:     { select: "SUM(ps.goals_conceded)::int",                           order: "SUM(ps.goals_conceded)",                  dir: "ASC"  },
};

// ─── GET /api/analytics/leaderboard ──────────────────────────────────────────
router.get("/leaderboard", async (req: Request, res: Response, next: NextFunction) => {
  const metric    = String(req.query.metric   ?? "rating");
  const seasonId  = req.query.seasonId  ? Number(req.query.seasonId)  : null;
  const positions = req.query.positions ? String(req.query.positions) : null;
  const limit     = Math.min(100, Math.max(5, Number(req.query.limit ?? 25)));

  const sortDirParam  = req.query.sortDir     ? String(req.query.sortDir).toLowerCase()  : null;
  const debutYearMax  = req.query.debutYearMax ? Number(req.query.debutYearMax)            : null;

  if (!METRIC_MAP[metric]) {
    return res.status(400).json({ error: `Métrica inválida: ${metric}` });
  }
  if (seasonId !== null && (isNaN(seasonId) || seasonId < 1)) {
    return res.status(400).json({ error: "seasonId debe ser un entero positivo" });
  }
  if (debutYearMax !== null && (isNaN(debutYearMax) || debutYearMax < 1900)) {
    return res.status(400).json({ error: "debutYearMax inválido" });
  }

  const def = METRIC_MAP[metric];
  // Allow client to override sort direction (useful for toggleable ASC/DESC)
  const effectiveDir: "ASC" | "DESC" =
    sortDirParam === "asc" ? "ASC" : sortDirParam === "desc" ? "DESC" : def.dir;

  const params: (string | number | string[])[] = [];
  const conditions: string[] = [];

  if (seasonId) {
    params.push(seasonId);
    conditions.push(`ps.season_id = $${params.length}`);
  }

  const VALID_POSITIONS = new Set([
    "GK", "CB", "LB", "RB", "LWB", "RWB",
    "CDM", "CM", "CAM", "LM", "RM",
    "LW", "RW", "SS", "CF", "ST",
  ]);

  if (positions) {
    const posArr = positions
      .split(",")
      .map((p: string) => p.trim().toUpperCase())
      .filter((p) => VALID_POSITIONS.has(p));
    if (posArr.length > 0) {
      params.push(posArr);
      conditions.push(`p.position = ANY($${params.length})`);
    }
  }

  // Excluir jugadores cuyo debut sea posterior al año de la temporada seleccionada
  if (debutYearMax) {
    params.push(debutYearMax);
    conditions.push(`(p.debut_year IS NULL OR p.debut_year <= $${params.length})`);
  }

  const whereClause  = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const minMatchesHaving = "HAVING SUM(ps.matches_played) >= 1";

  params.push(limit);

  const sql = `
    SELECT
      p.id,
      p.name,
      p.photo_url                                                        AS "photoUrl",
      p.position,
      p.nationality,
      t.name                                                             AS "teamName",
      t.logo_url                                                         AS "teamLogoUrl",
      SUM(ps.goals)::int                                                 AS goals,
      SUM(ps.assists)::int                                               AS assists,
      (SUM(ps.goals) + SUM(ps.assists))::int                            AS combined,
      SUM(ps.matches_played)::int                                        AS "matchesPlayed",
      ROUND(AVG(ps.sofascore_rating::numeric), 1)                       AS rating,
      SUM(ps.tackles)::int                                               AS tackles,
      SUM(ps.interceptions)::int                                         AS interceptions,
      SUM(ps.recoveries)::int                                            AS recoveries,
      ROUND(AVG(ps.aerial_duels_won_pct::numeric), 1)                   AS "aerialDuelsWonPct",
      ROUND(AVG(ps.key_passes_per_game::numeric), 2)                    AS "keyPassesPerGame",
      ROUND(AVG(ps.pass_accuracy_pct::numeric), 1)                      AS "passAccuracyPct",
      ROUND(AVG(ps.xg_per_game::numeric), 2)                            AS "xgPerGame",
      ROUND(AVG(ps.xa_per_game::numeric), 2)                            AS "xaPerGame",
      ROUND(AVG(ps.shots_on_target_pct::numeric), 1)                    AS "shotsOnTargetPct",
      ROUND(AVG(ps.save_pct::numeric), 1)                               AS "savePct",
      SUM(ps.clean_sheets)::int                                          AS "cleanSheets",
      SUM(ps.goals_conceded)::int                                        AS "goalsConceded",
      ${def.select}                                                      AS "metricValue"
    FROM player_stats ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    ${whereClause}
    GROUP BY p.id, p.name, p.photo_url, p.position, p.nationality, t.name, t.logo_url
    ${minMatchesHaving}
    ORDER BY ${def.order} ${effectiveDir} NULLS LAST
    LIMIT $${params.length}
  `;

  try {
    const result = await pool.query(sql, params);
    const rows = result.rows.map((row: Record<string, unknown>, idx: number) => ({
      rank:              idx + 1,
      id:                Number(row.id),
      name:              String(row.name),
      photoUrl:          row.photoUrl ?? null,
      position:          String(row.position),
      nationality:       row.nationality ?? null,
      teamName:          row.teamName ?? null,
      teamLogoUrl:       row.teamLogoUrl ?? null,
      goals:             Number(row.goals)            || 0,
      assists:           Number(row.assists)           || 0,
      combined:          Number(row.combined)          || 0,
      matchesPlayed:     Number(row.matchesPlayed)     || 0,
      rating:            Number(row.rating)            || 0,
      tackles:           Number(row.tackles)           || 0,
      interceptions:     Number(row.interceptions)     || 0,
      recoveries:        Number(row.recoveries)        || 0,
      aerialDuelsWonPct: Number(row.aerialDuelsWonPct) || 0,
      keyPassesPerGame:  Number(row.keyPassesPerGame)  || 0,
      passAccuracyPct:   Number(row.passAccuracyPct)   || 0,
      xgPerGame:         Number(row.xgPerGame)         || 0,
      xaPerGame:         Number(row.xaPerGame)         || 0,
      shotsOnTargetPct:  Number(row.shotsOnTargetPct)  || 0,
      savePct:           Number(row.savePct)            || 0,
      cleanSheets:       Number(row.cleanSheets)        || 0,
      goalsConceded:     Number(row.goalsConceded)      || 0,
      metricValue:       Number(row.metricValue)        || 0,
    }));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/summary ──────────────────────────────────────────────
router.get("/summary", async (req: Request, res: Response, next: NextFunction) => {
  const seasonId = req.query.seasonId ? Number(req.query.seasonId) : null;

  if (seasonId !== null && (isNaN(seasonId) || seasonId < 1)) {
    return res.status(400).json({ error: "seasonId debe ser un entero positivo" });
  }

  const params: number[] = [];
  const whereClause = seasonId
    ? `WHERE ps.season_id = $${params.push(seasonId)}`
    : "";

  const sql = `
    SELECT
      SUM(ps.goals)::int                                  AS "totalGoals",
      SUM(ps.assists)::int                                AS "totalAssists",
      ROUND(AVG(ps.sofascore_rating::numeric), 1)        AS "avgRating",
      COUNT(DISTINCT ps.player_id)::int                  AS "activePlayers",
      SUM(ps.matches_played)::int                        AS "totalMatches"
    FROM player_stats ps
    ${whereClause}
  `;

  try {
    const result = await pool.query(sql, params);
    const row = result.rows[0];
    res.json({
      totalGoals:    Number(row.totalGoals)    || 0,
      totalAssists:  Number(row.totalAssists)  || 0,
      avgRating:     Number(row.avgRating)     || 0,
      activePlayers: Number(row.activePlayers) || 0,
      totalMatches:  Number(row.totalMatches)  || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
