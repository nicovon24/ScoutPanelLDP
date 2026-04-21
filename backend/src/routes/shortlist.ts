import { Router, Request, Response, NextFunction } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { shortlistEntries, players, playerStats } from "../db/schema";

const router = Router();

// GET /api/shortlist — favoritos del usuario con datos de jugador + equipo + última stat
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const entries = await db.query.shortlistEntries.findMany({
      where: eq(shortlistEntries.userId, userId),
      with: {
        player: {
          with: {
            team: true,
            stats: {
              orderBy: [desc(playerStats.seasonId)],
              limit: 1,
            },
          },
        },
      },
      orderBy: (s, { desc: d }) => [d(s.addedAt)],
    });
    res.json(entries.map((e) => ({ ...e.player, addedAt: e.addedAt })));
  } catch (error) {
    next(error);
  }
});

// GET /api/shortlist/ids — solo IDs para checks rápidos de isFavorite
router.get("/ids", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const entries = await db.query.shortlistEntries.findMany({
      where: eq(shortlistEntries.userId, userId),
      columns: { playerId: true },
    });
    res.json(entries.map((e) => e.playerId));
  } catch (error) {
    next(error);
  }
});

// POST /api/shortlist/:playerId — agregar jugador a favoritos
router.post("/:playerId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: "playerId inválido" });

    const player = await db.query.players.findFirst({ where: eq(players.id, playerId) });
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });

    await db.insert(shortlistEntries)
      .values({ userId, playerId })
      .onConflictDoNothing();

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/shortlist/:playerId — quitar jugador de favoritos
router.delete("/:playerId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: "playerId inválido" });

    const deleted = await db
      .delete(shortlistEntries)
      .where(
        and(
          eq(shortlistEntries.userId, userId),
          eq(shortlistEntries.playerId, playerId),
        ),
      )
      .returning({ id: shortlistEntries.playerId });

    if (deleted.length === 0) {
      return res.status(404).json({ error: "El jugador no estaba en tu lista" });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
