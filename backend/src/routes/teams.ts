import { Router } from "express";
import { db } from "../db";
import { teams, players } from "../db/schema";

const router = Router();

// GET /api/teams - Listado de todos los equipos
router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(teams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
