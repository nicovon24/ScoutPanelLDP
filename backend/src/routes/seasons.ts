import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { seasons } from "../db/schema";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await db.select().from(seasons).orderBy(desc(seasons.year));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
