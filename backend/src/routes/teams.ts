import { Router, Request, Response } from "express";
import { db } from "../db";
import { teams } from "../db/schema";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(teams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
