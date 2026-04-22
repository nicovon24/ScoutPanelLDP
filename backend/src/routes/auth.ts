import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z, type ZodError } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { JwtUser } from "../types/express";

const router = Router();

/** Nombre de la cookie httpOnly con el JWT (misma clave que el cliente documenta en README). */
export const ACCESS_TOKEN_COOKIE = "accessToken";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Falla en producción si no hay JWT_SECRET explícito
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var es obligatorio");
}
const JWT_SECRET: string = process.env.JWT_SECRET ?? "scout-panel-secret-dev";

const isProd = process.env.NODE_ENV === "production";

function setAccessTokenCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

/** Limpia la cookie httpOnly (público, no requiere JWT). */
export function clearAccessTokenCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
}

function getJwtFromRequest(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    const t = h.split(/\s+/)[1]?.trim();
    return t || undefined;
  }
  const c = req.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof c === "string" && c.length > 0 ? c : undefined;
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

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    setAccessTokenCookie(res, token);

    res.status(201).json({
      token,
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

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    setAccessTokenCookie(res, token);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout — público: borra la cookie httpOnly
router.post("/logout", (_req: Request, res: Response) => {
  clearAccessTokenCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — Devuelve el usuario logueado (requiere token)
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
