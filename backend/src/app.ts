import express from "express";
import cors from "cors";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import seasonRoutes from "./routes/seasons";
import authRoutes, { requireAuth } from "./routes/auth";
import shortlistRoutes from "./routes/shortlist";

export const app = express();

app.use(cors());
app.use(express.json());

// ── Rutas públicas ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rutas protegidas — requieren JWT ──────────────────────────────────────────
app.use("/api/players",  requireAuth, playerRoutes);
app.use("/api/teams",    requireAuth, teamRoutes);
app.use("/api/seasons",  requireAuth, seasonRoutes);
app.use("/api/shortlist", shortlistRoutes); 
