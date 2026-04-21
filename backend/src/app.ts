import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import seasonRoutes from "./routes/seasons";
import authRoutes, { requireAuth } from "./routes/auth";
import shortlistRoutes from "./routes/shortlist";
import analyticsRoutes from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

// ALLOWED_ORIGINS: lista de orígenes exactos separados por coma.
// ALLOWED_ORIGIN_PATTERNS: lista de patrones regex separados por coma (para Vercel preview branches, etc.)
// Ejemplos:
//   ALLOWED_ORIGINS=http://localhost:3000,https://scoutpanel.com
//   ALLOWED_ORIGIN_PATTERNS=https://.*\.vercel\.app,https://scout-panel-.*\.vercel\.app
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

const allowedOriginPatterns = process.env.ALLOWED_ORIGIN_PATTERNS
  ? process.env.ALLOWED_ORIGIN_PATTERNS.split(",").map((p) => new RegExp(p.trim()))
  : [];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Requests sin Origin (Postman, Supertest, curl, server-to-server) siempre pasan
      if (!origin) return callback(null, true);
      const exactMatch   = allowedOrigins.some((o) => origin === o);
      const patternMatch = allowedOriginPatterns.some((re) => re.test(origin));
      if (exactMatch || patternMatch) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(express.json());

// ── Rutas públicas ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rutas protegidas — requieren JWT ──────────────────────────────────────────
app.use("/api/players",   requireAuth, playerRoutes);
app.use("/api/teams",     requireAuth, teamRoutes);
app.use("/api/seasons",   requireAuth, seasonRoutes);
app.use("/api/shortlist", requireAuth, shortlistRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);

// ── Middleware global de errores (debe ir último) ────────────────────────────
app.use(errorHandler);
