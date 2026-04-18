import express from "express";
import cors from "cors";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import seasonRoutes from "./routes/seasons";
import authRoutes, { requireAuth } from "./routes/auth";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes Públicas
app.use("/api/auth", authRoutes);

// Middleware de Protección Global
app.use(requireAuth);

// Routes Protegidas (necesitan token)
app.use("/api/players", playerRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/seasons", seasonRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 ScoutPanel API running at http://localhost:${port}`);
});
