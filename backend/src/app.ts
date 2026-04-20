import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import seasonRoutes from "./routes/seasons";
import authRoutes, { requireAuth } from "./routes/auth";
import shortlistRoutes from "./routes/shortlist";
import analyticsRoutes from "./routes/analytics";

export const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin === o)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

// ── Rutas públicas ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rutas protegidas — requieren JWT ──────────────────────────────────────────
app.use("/api/players",  requireAuth, playerRoutes);
app.use("/api/teams",    requireAuth, teamRoutes);
app.use("/api/seasons",  requireAuth, seasonRoutes);
app.use("/api/shortlist",  shortlistRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
