import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "../db/schema";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "scout-panel-secret-dev";

// ── Middleware de autenticación (para proteger rutas en el futuro) ────────────
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me — Devuelve el usuario logueado (requiere token)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user;
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id),
      columns: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
