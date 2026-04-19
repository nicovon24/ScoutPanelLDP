import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { shortlistEntries, players } from "../db/schema";
import { requireAuth } from "./auth";

const router = Router();

// Todas las rutas de shortlist requieren autenticación
router.use(requireAuth);

// GET /api/shortlist — favoritos del usuario con datos de jugador + equipo + última stat
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const entries = await db.query.shortlistEntries.findMany({
      where: eq(shortlistEntries.userId, userId),
      with: {
        player: {
          with: {
            team: true,
            stats: {
              orderBy: (s: any, { desc }: any) => [desc(s.seasonId)],
              limit: 1,
            },
          },
        },
      },
      orderBy: (s, { desc }) => [desc(s.addedAt)],
    });
    res.json(entries.map((e) => ({ ...e.player, addedAt: e.addedAt })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/shortlist/ids — solo IDs para checks rápidos de isFavorite
router.get("/ids", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const entries = await db.query.shortlistEntries.findMany({
      where: eq(shortlistEntries.userId, userId),
      columns: { playerId: true },
    });
    res.json(entries.map((e) => e.playerId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/shortlist/:playerId — agregar jugador a favoritos
router.post("/:playerId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: "playerId inválido" });

    const player = await db.query.players.findFirst({ where: eq(players.id, playerId) });
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });

    await db.insert(shortlistEntries)
      .values({ userId, playerId })
      .onConflictDoNothing();

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/shortlist/:playerId — quitar jugador de favoritos
router.delete("/:playerId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) return res.status(400).json({ error: "playerId inválido" });

    await db
      .delete(shortlistEntries)
      .where(
        and(
          eq(shortlistEntries.userId, userId),
          eq(shortlistEntries.playerId, playerId),
        ),
      );

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
