import { Router } from "express";
import { db } from "../db";
import { players, playerStats, playerRatings, playerInjuries, teams } from "../db/schema";
import { eq, and, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";

const router = Router();

// GET /api/players - Listado con filtros
router.get("/", async (req, res) => {
  try {
    const { position, nationality, teamId, ageMin, ageMax, page = "1", limit = "10" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    if (position) conditions.push(eq(players.position, position as string));
    if (nationality) conditions.push(eq(players.nationality, nationality as string));
    if (teamId) conditions.push(eq(players.teamId, Number(teamId)));

    // Filtros de edad (calculado desde dateOfBirth)
    if (ageMin || ageMax) {
      const now = new Date();
      if (ageMin) {
        const minDate = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate());
        conditions.push(lte(players.dateOfBirth, minDate.toISOString().split('T')[0]));
      }
      if (ageMax) {
        const maxDate = new Date(now.getFullYear() - Number(ageMax) - 1, now.getMonth(), now.getDate());
        conditions.push(gte(players.dateOfBirth, maxDate.toISOString().split('T')[0]));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.players.findMany({
      where,
      limit: Number(limit),
      offset,
      with: {
        team: true,
      },
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/players/compare - Comparación side-by-side
router.get("/compare", async (req, res) => {
  try {
    const { ids, seasonId } = req.query;
    if (!ids) return res.status(400).json({ error: "ids is required" });

    const playerIds = (ids as string).split(",").map(Number);
    let sid: number;

    if (seasonId) {
      sid = Number(seasonId);
    } else {
      // Si no hay seasonId, buscamos la temporada más reciente
      const latestSeason = await db.query.seasons.findFirst({
        orderBy: (seasons, { desc }) => [desc(seasons.year)],
      });
      if (!latestSeason) return res.status(404).json({ error: "No seasons found" });
      sid = latestSeason.id;
    }

    const data = await db.query.players.findMany({
      where: inArray(players.id, playerIds),
      with: {
        team: true,
        stats: {
          where: eq(playerStats.seasonId, sid)
        },
        ratings: {
          where: eq(playerRatings.seasonId, sid)
        }
      }
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/players/:id - Perfil completo
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const player = await db.query.players.findFirst({
      where: eq(players.id, id),
      with: {
        team: true,
        stats: {
          with: {
            season: true
          }
        },
        ratings: true,
        injuries: true
      }
    });

    if (!player) return res.status(404).json({ error: "Player not found" });

    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/players/search - Búsqueda inteligente (nombre o nacionalidad)
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      return res.json({ players: [], teams: [] });
    }

    const pattern = `%${q}%`;

    // Jugadores que coincidan por nombre o nacionalidad
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
      .where(
        or(
          ilike(players.name, pattern),
          ilike(players.nationality, pattern)
        )
      )
      .limit(8);

    // Equipos que coincidan por nombre o país
    const matchingTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        country: teams.country,
        logoUrl: teams.logoUrl,
      })
      .from(teams)
      .where(
        or(
          ilike(teams.name, pattern),
          ilike(teams.country, pattern)
        )
      )
      .limit(4);

    res.json({ players: matchingPlayers, teams: matchingTeams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
