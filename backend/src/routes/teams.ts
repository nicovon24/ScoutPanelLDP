import { Router, Request, Response } from "express";
import { db } from "../db";
import { teams, players } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(teams);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const teamId = parseInt(req.params.id, 10);
  if (isNaN(teamId)) {
    res.status(400).json({ error: "ID de equipo inválido" });
    return;
  }
  try {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    const roster = await db
      .select({
        id: players.id,
        name: players.name,
        position: players.position,
        photoUrl: players.photoUrl,
        nationality: players.nationality,
        marketValueM: players.marketValueM,
        dateOfBirth: players.dateOfBirth,
        contractType: players.contractType,
        contractUntil: players.contractUntil,
      })
      .from(players)
      .where(eq(players.teamId, teamId))
      .orderBy(players.name);

    res.json({ ...team, players: roster });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
