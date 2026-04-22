import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcrypt";
import { z, type ZodError } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { JwtUser } from "../types/express";

const router = Router();

/** Cookie httpOnly que transporta el refresh token (ruta restringida a /api/auth). */
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

// Secrets y duraciones desde variables de entorno
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var es obligatorio");
}
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET_REFRESH) {
  throw new Error("JWT_SECRET_REFRESH env var es obligatorio");
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? "scout-panel-secret-dev";
const JWT_SECRET_REFRESH: string = process.env.JWT_SECRET_REFRESH ?? "scout-panel-refresh-secret-dev";
const JWT_EXPIRATION_ACCESS = (process.env.JWT_EXPIRATION_ACCESS ?? "15m") as StringValue;
const JWT_EXPIRATION_REFRESH = (process.env.JWT_EXPIRATION_REFRESH ?? "7d") as StringValue;

const isProd = process.env.NODE_ENV === "production";

/** Convierte strings como "7d", "15m" a milisegundos para maxAge. */
function parseExpToMs(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7d
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: parseExpToMs(JWT_EXPIRATION_REFRESH),
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
}

/** Solo acepta Bearer header; el access token ya no va en cookie. */
function getJwtFromRequest(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    const t = h.split(/\s+/)[1]?.trim();
    return t || undefined;
  }
  return undefined;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = getJwtFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as unknown as JwtUser;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// ── Schemas de validación ─────────────────────────────────────────────────────
const str = {
  email: {
    required: 'Falta el campo "email" en el JSON (Content-Type: application/json).',
    invalid: 'El campo "email" debe ser un texto.',
  },
  password: {
    required: 'Falta el campo "password" en el JSON.',
    invalid: 'El campo "password" debe ser un texto.',
  },
  name: {
    required: 'Falta el campo "name" en el JSON (no uses "user"; el API espera "name").',
    invalid: 'El campo "name" debe ser un texto.',
  },
} as const;

export const registerSchema = z.object({
  email: z
    .string({ required_error: str.email.required, invalid_type_error: str.email.invalid })
    .min(1, "Ingresá un email")
    .email("El email no tiene un formato válido")
    .max(255)
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string({ required_error: str.password.required, invalid_type_error: str.password.invalid })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72),
  name: z
    .string({ required_error: str.name.required, invalid_type_error: str.name.invalid })
    .min(1, "El nombre no puede estar vacío")
    .max(100)
    .transform((v) => v.trim()),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: str.email.required, invalid_type_error: str.email.invalid })
    .min(1, "Ingresá un email")
    .email("El email no tiene un formato válido")
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string({ required_error: str.password.required, invalid_type_error: str.password.invalid })
    .min(1, "Ingresá la contraseña"),
});

/** Un mensaje legible + mapa por campo para el cliente (Postman, front, etc.). */
function authZodErrorResponse(err: ZodError): { error: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const iss of err.issues) {
    const key = iss.path.length > 0 ? String(iss.path[0]) : "body";
    if (!fields[key]) fields[key] = iss.message;
  }
  const parts = Object.entries(fields).map(([k, msg]) => `"${k}": ${msg}`);
  const error = parts.length === 1 ? parts[0] : `Revisá estos campos → ${parts.join(" · ")}`;
  return { error, fields };
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(authZodErrorResponse(parsed.error));
    return;
  }
  const { email, password, name } = parsed.data;

  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      res.status(409).json({ error: "El email ya está registrado" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash, name }).returning();

    // Sin sesión: el usuario debe iniciar sesión en `/login` (no tokens ni cookies).
    res.status(201).json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(authZodErrorResponse(parsed.error));
    return;
  }
  const { email, password } = parsed.data;

  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }

    const payload = { id: user.id, email: user.email, name: user.name };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION_ACCESS });
    const refreshToken = jwt.sign(payload, JWT_SECRET_REFRESH, { expiresIn: JWT_EXPIRATION_REFRESH });

    setRefreshCookie(res, refreshToken);

    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh — renueva el access token usando el refresh token de la cookie
router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "No hay sesión activa" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET_REFRESH) as unknown as JwtUser;

    // Verificar que el usuario sigue existiendo en DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id),
      columns: { id: true, email: true, name: true },
    });
    if (!user) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }

    const newPayload = { id: user.id, email: user.email, name: user.name };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION_ACCESS });

    res.json({ token: accessToken, user: newPayload });
  } catch {
    clearRefreshCookie(res);
    res.status(401).json({ error: "Sesión expirada" });
  }
});

// POST /api/auth/logout — borra la cookie httpOnly del refresh token
router.post("/logout", (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — devuelve el usuario logueado (requiere access token)
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.user!;
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id),
      columns: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
