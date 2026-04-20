import { Router, Request, Response } from "express";
import { db } from "../db";
import { seasons } from "../db/schema";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(seasons).orderBy(desc(seasons.year));
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
