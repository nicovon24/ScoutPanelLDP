import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { JwtUser } from "../types/express";

const router = Router();

// Falla en producción si no hay JWT_SECRET explícito
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var es obligatorio");
}
const JWT_SECRET: string = process.env.JWT_SECRET ?? "scout-panel-secret-dev";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET) as unknown as JwtUser;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// ── Schemas de validación ─────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("El email no tiene un formato válido").max(255).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
  name: z.string().min(1, "El nombre es requerido").max(100).transform((v) => v.trim()),
});

export const loginSchema = z.object({
  email: z.string().email("El email no tiene un formato válido").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "La contraseña es requerida"),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password, name } = parsed.data;

  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return res.status(409).json({ error: "El email ya está registrado" });

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash, name }).returning();

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Credenciales incorrectas" });

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
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/auth/me — Devuelve el usuario logueado (requiere token)
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.user!;
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id),
      columns: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
