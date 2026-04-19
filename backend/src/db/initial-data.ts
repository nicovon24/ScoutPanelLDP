// seed.ts — Liga Profesional Argentina · Apertura 2026
// ✅ ~55 jugadores verificados en el torneo (abril 2026)
// ✅ Fotos: 100% Fotmob (images.fotmob.com/image_resources/playerimages/{ID}.png)
// ✅ 5 River · 5 Boca · 5 Racing · 5 Independiente · 5 Belgrano · 5 Talleres · 5 Instituto
//    + jugadores de Huracán, San Lorenzo, Lanús, Defensa y Justicia, Estudiantes, etc.
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { teams, seasons, players, playerStats, playerRatings, playerInjuries, users } from "./schema";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── HELPERS ────────────────────────────────────────────────────────────────
const addDays = (d: string, n: number) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
};
const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const rndI = (min: number, max: number) => Math.round(rnd(min, max));
const vary = (base: number, pct = 0.15) =>
  Math.max(0, base * (1 - pct + Math.random() * pct * 2)).toFixed(2);
const varyI = (base: number, pct = 0.15) =>
  Math.max(0, Math.round(base * (1 - pct + Math.random() * pct * 2)));

// Foto Fotmob: URL directa estable
const fm = (id: number) =>
  `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

// ─── INJURY TYPES ────────────────────────────────────────────────────────────
const INJTYPES: Record<string, string[]> = {
  CF: ["Desgarro isquiotibial", "Esguince de tobillo", "Rotura fibrilar cuadriceps", "Contusion muscular"],
  SS: ["Desgarro isquiotibial", "Esguince de tobillo", "Sobrecarga muscular", "Contusion costal"],
  LW: ["Esguince de tobillo", "Desgarro isquiotibial", "Rotura fibrilar gemelo", "Contusion muscular"],
  RW: ["Esguince de tobillo", "Desgarro isquiotibial", "Rotura fibrilar gemelo", "Contusion muscular"],
  CAM: ["Esguince de tobillo", "Sobrecarga lumbar", "Desgarro isquiotibial", "Contusion de rodilla"],
  CM: ["Sobrecarga muscular", "Esguince de tobillo", "Contusion de rodilla", "Desgarro aductor"],
  CDM: ["Desgarro aductor", "Sobrecarga lumbar", "Contusion de rodilla", "Esguince de tobillo"],
  CB: ["Rotura ligamento cruzado anterior", "Desgarro aductor", "Contusion de rodilla", "Esguince de tobillo"],
  LB: ["Esguince de tobillo", "Desgarro aductor", "Sobrecarga muscular", "Contusion muscular"],
  RB: ["Esguince de tobillo", "Desgarro aductor", "Sobrecarga muscular", "Contusion muscular"],
  GK: ["Fractura de dedo", "Esguince de muneca", "Contusion de hombro", "Desgarro isquiotibial"],
};
const SEASON_START: Record<number, string> = {
  2023: "2023-01-21", 2024: "2024-01-20", 2025: "2025-01-18", 2026: "2026-01-22",
};

// ─── STAT TYPES ──────────────────────────────────────────────────────────────
interface RS {
  mp: number; min: number; g: number; a: number;
  yc: number; rc: number; rating: number;
  xgB: number; shotB: number; shotOTB: number;
  xaB: number; kpB: number; passB: number;
  tackB: number; intB: number; recB: number;
  aerB: number; dribB: number; dribRB: number;
  saveB?: number; csB?: number;
}

// ─── LEVEL A: datos reales ────────────────────────────────────────────────────
const REAL: Record<string, Record<number, RS>> = {
  // ── RIVER PLATE ──
  "Facundo Colidio": {
    2023: { mp: 14, min: 850, g: 2, a: 4, yc: 1, rc: 0, rating: 6.9, xgB: .22, shotB: 1.8, shotOTB: 44, xaB: .28, kpB: 1.6, passB: 67, tackB: 8, intB: 4, recB: 12, aerB: 24, dribB: 1.8, dribRB: 50 },
    2024: { mp: 12, min: 720, g: 2, a: 2, yc: 2, rc: 0, rating: 6.9, xgB: .24, shotB: 1.9, shotOTB: 46, xaB: .30, kpB: 1.8, passB: 68, tackB: 9, intB: 4, recB: 13, aerB: 25, dribB: 1.9, dribRB: 51 },
    2025: { mp: 22, min: 1540, g: 7, a: 1, yc: 4, rc: 0, rating: 7.1, xgB: .32, shotB: 2.3, shotOTB: 48, xaB: .22, kpB: 1.5, passB: 66, tackB: 10, intB: 5, recB: 14, aerB: 26, dribB: 2.1, dribRB: 52 },
    2026: { mp: 13, min: 900, g: 3, a: 1, yc: 1, rc: 1, rating: 7.2, xgB: .30, shotB: 2.1, shotOTB: 50, xaB: .25, kpB: 1.8, passB: 67, tackB: 8, intB: 3, recB: 11, aerB: 28, dribB: 1.9, dribRB: 52 },
  },
  "Lucas Martínez Quarta": {
    2023: { mp: 22, min: 1800, g: 2, a: 1, yc: 3, rc: 0, rating: 6.9, xgB: .06, shotB: .4, shotOTB: 24, xaB: .04, kpB: .5, passB: 84, tackB: 70, intB: 42, recB: 56, aerB: 62, dribB: .4, dribRB: 34 },
    2024: { mp: 20, min: 1650, g: 1, a: 0, yc: 2, rc: 0, rating: 6.9, xgB: .05, shotB: .3, shotOTB: 22, xaB: .03, kpB: .4, passB: 84, tackB: 68, intB: 40, recB: 54, aerB: 61, dribB: .3, dribRB: 33 },
    2025: { mp: 26, min: 2200, g: 2, a: 0, yc: 3, rc: 0, rating: 7.0, xgB: .07, shotB: .4, shotOTB: 26, xaB: .04, kpB: .5, passB: 85, tackB: 72, intB: 44, recB: 58, aerB: 63, dribB: .4, dribRB: 36 },
    2026: { mp: 13, min: 1050, g: 1, a: 0, yc: 2, rc: 0, rating: 7.0, xgB: .05, shotB: .3, shotOTB: 22, xaB: .03, kpB: .4, passB: 85, tackB: 70, intB: 43, recB: 57, aerB: 63, dribB: .3, dribRB: 35 },
  },
  "Pablo Solari": {
    2023: { mp: 20, min: 1540, g: 5, a: 3, yc: 2, rc: 0, rating: 7.0, xgB: .28, shotB: 2.2, shotOTB: 42, xaB: .20, kpB: 1.7, passB: 72, tackB: 12, intB: 6, recB: 16, aerB: 22, dribB: 2.2, dribRB: 54 },
    2024: { mp: 22, min: 1650, g: 6, a: 4, yc: 3, rc: 0, rating: 7.1, xgB: .30, shotB: 2.4, shotOTB: 44, xaB: .24, kpB: 1.9, passB: 73, tackB: 13, intB: 7, recB: 17, aerB: 23, dribB: 2.4, dribRB: 55 },
    2025: { mp: 18, min: 1380, g: 4, a: 2, yc: 1, rc: 0, rating: 6.9, xgB: .26, shotB: 2.1, shotOTB: 40, xaB: .18, kpB: 1.5, passB: 71, tackB: 11, intB: 6, recB: 15, aerB: 21, dribB: 2.1, dribRB: 52 },
    2026: { mp: 9, min: 720, g: 3, a: 1, yc: 1, rc: 0, rating: 7.1, xgB: .32, shotB: 2.3, shotOTB: 45, xaB: .20, kpB: 1.7, passB: 74, tackB: 12, intB: 6, recB: 16, aerB: 22, dribB: 2.3, dribRB: 54 },
  },
  "Sebastián Driussi": {
    2023: { mp: 28, min: 2100, g: 12, a: 6, yc: 3, rc: 0, rating: 7.4, xgB: .42, shotB: 2.6, shotOTB: 48, xaB: .28, kpB: 1.8, passB: 76, tackB: 10, intB: 5, recB: 14, aerB: 30, dribB: 1.8, dribRB: 50 },
    2024: { mp: 25, min: 1950, g: 8, a: 4, yc: 2, rc: 0, rating: 7.2, xgB: .36, shotB: 2.3, shotOTB: 45, xaB: .22, kpB: 1.5, passB: 74, tackB: 9, intB: 4, recB: 13, aerB: 28, dribB: 1.6, dribRB: 48 },
    2025: { mp: 22, min: 1700, g: 6, a: 3, yc: 2, rc: 0, rating: 7.0, xgB: .30, shotB: 2.0, shotOTB: 42, xaB: .18, kpB: 1.3, passB: 73, tackB: 8, intB: 4, recB: 12, aerB: 26, dribB: 1.4, dribRB: 46 },
    2026: { mp: 12, min: 940, g: 3, a: 2, yc: 1, rc: 0, rating: 7.4, xgB: .38, shotB: 2.4, shotOTB: 47, xaB: .22, kpB: 1.6, passB: 76, tackB: 9, intB: 4, recB: 13, aerB: 28, dribB: 1.6, dribRB: 49 },
  },
  "Gonzalo Montiel": {
    2023: { mp: 24, min: 1980, g: 2, a: 5, yc: 4, rc: 0, rating: 7.1, xgB: .08, shotB: .7, shotOTB: 34, xaB: .22, kpB: 1.4, passB: 82, tackB: 50, intB: 28, recB: 42, aerB: 44, dribB: 1.0, dribRB: 44 },
    2024: { mp: 20, min: 1620, g: 1, a: 3, yc: 3, rc: 0, rating: 7.0, xgB: .06, shotB: .6, shotOTB: 30, xaB: .18, kpB: 1.2, passB: 81, tackB: 46, intB: 25, recB: 38, aerB: 42, dribB: .8, dribRB: 42 },
    2025: { mp: 24, min: 1960, g: 2, a: 4, yc: 4, rc: 0, rating: 7.1, xgB: .07, shotB: .6, shotOTB: 32, xaB: .20, kpB: 1.3, passB: 83, tackB: 52, intB: 29, recB: 44, aerB: 45, dribB: .9, dribRB: 44 },
    2026: { mp: 13, min: 1060, g: 3, a: 2, yc: 2, rc: 0, rating: 7.2, xgB: .08, shotB: .8, shotOTB: 36, xaB: .18, kpB: 1.2, passB: 82, tackB: 48, intB: 27, recB: 40, aerB: 44, dribB: .9, dribRB: 44 },
  },
  // ── BOCA JUNIORS ──
  "Miguel Merentiel": {
    2023: { mp: 22, min: 1650, g: 10, a: 3, yc: 2, rc: 0, rating: 7.3, xgB: .52, shotB: 3.0, shotOTB: 44, xaB: .14, kpB: .9, passB: 70, tackB: 10, intB: 5, recB: 14, aerB: 46, dribB: 1.4, dribRB: 44 },
    2024: { mp: 24, min: 1800, g: 8, a: 2, yc: 1, rc: 0, rating: 7.1, xgB: .44, shotB: 2.7, shotOTB: 42, xaB: .12, kpB: .8, passB: 71, tackB: 9, intB: 4, recB: 12, aerB: 47, dribB: 1.3, dribRB: 43 },
    2025: { mp: 19, min: 1620, g: 7, a: 1, yc: 1, rc: 0, rating: 7.1, xgB: .48, shotB: 2.8, shotOTB: 43, xaB: .10, kpB: .9, passB: 72, tackB: 10, intB: 5, recB: 13, aerB: 48, dribB: 1.3, dribRB: 44 },
    2026: { mp: 12, min: 980, g: 5, a: 1, yc: 1, rc: 0, rating: 7.4, xgB: .55, shotB: 3.0, shotOTB: 46, xaB: .12, kpB: 1.1, passB: 73, tackB: 9, intB: 4, recB: 12, aerB: 50, dribB: 1.0, dribRB: 45 },
  },
  "Kevin Zenón": {
    2023: { mp: 21, min: 1480, g: 2, a: 0, yc: 1, rc: 0, rating: 6.9, xgB: .14, shotB: 1.1, shotOTB: 36, xaB: .16, kpB: 1.4, passB: 76, tackB: 14, intB: 7, recB: 18, aerB: 22, dribB: 1.8, dribRB: 48 },
    2024: { mp: 18, min: 1080, g: 2, a: 1, yc: 1, rc: 0, rating: 7.1, xgB: .18, shotB: 1.3, shotOTB: 40, xaB: .22, kpB: 1.8, passB: 78, tackB: 16, intB: 8, recB: 20, aerB: 24, dribB: 2.0, dribRB: 51 },
    2025: { mp: 26, min: 1088, g: 2, a: 0, yc: 2, rc: 1, rating: 6.8, xgB: .22, shotB: .97, shotOTB: 92, xaB: .12, kpB: 1.2, passB: 75, tackB: 13, intB: 6, recB: 17, aerB: 22, dribB: 1.6, dribRB: 46 },
    2026: { mp: 5, min: 316, g: 0, a: 0, yc: 0, rc: 0, rating: 6.5, xgB: .10, shotB: .6, shotOTB: 34, xaB: .10, kpB: .9, passB: 72, tackB: 8, intB: 4, recB: 12, aerB: 20, dribB: 1.2, dribRB: 42 },
  },
  "Cristian Medina": {
    2023: { mp: 20, min: 1540, g: 3, a: 2, yc: 2, rc: 0, rating: 7.0, xgB: .12, shotB: .9, shotOTB: 33, xaB: .18, kpB: 1.4, passB: 86, tackB: 40, intB: 22, recB: 36, aerB: 40, dribB: .9, dribRB: 43 },
    2024: { mp: 22, min: 1680, g: 2, a: 3, yc: 3, rc: 0, rating: 7.0, xgB: .10, shotB: .8, shotOTB: 32, xaB: .22, kpB: 1.5, passB: 87, tackB: 44, intB: 24, recB: 38, aerB: 42, dribB: 1.0, dribRB: 44 },
    2025: { mp: 28, min: 2100, g: 3, a: 4, yc: 4, rc: 0, rating: 7.0, xgB: .11, shotB: .9, shotOTB: 33, xaB: .20, kpB: 1.5, passB: 87, tackB: 44, intB: 25, recB: 39, aerB: 42, dribB: 1.0, dribRB: 44 },
    2026: { mp: 11, min: 880, g: 1, a: 2, yc: 1, rc: 0, rating: 7.1, xgB: .10, shotB: .8, shotOTB: 32, xaB: .20, kpB: 1.5, passB: 87, tackB: 42, intB: 23, recB: 37, aerB: 42, dribB: .9, dribRB: 43 },
  },
  "Exequiel Zeballos": {
    2023: { mp: 24, min: 1680, g: 8, a: 5, yc: 2, rc: 0, rating: 7.4, xgB: .38, shotB: 2.4, shotOTB: 46, xaB: .30, kpB: 2.0, passB: 74, tackB: 12, intB: 6, recB: 16, aerB: 20, dribB: 2.6, dribRB: 58 },
    2024: { mp: 20, min: 1400, g: 5, a: 4, yc: 3, rc: 0, rating: 7.2, xgB: .32, shotB: 2.1, shotOTB: 44, xaB: .26, kpB: 1.8, passB: 72, tackB: 10, intB: 5, recB: 14, aerB: 18, dribB: 2.4, dribRB: 56 },
    2025: { mp: 22, min: 1540, g: 6, a: 4, yc: 2, rc: 0, rating: 7.4, xgB: .36, shotB: 2.3, shotOTB: 46, xaB: .28, kpB: 1.9, passB: 73, tackB: 11, intB: 5, recB: 15, aerB: 19, dribB: 2.5, dribRB: 57 },
    2026: { mp: 5, min: 380, g: 1, a: 1, yc: 0, rc: 0, rating: 7.6, xgB: .40, shotB: 2.5, shotOTB: 48, xaB: .30, kpB: 2.0, passB: 75, tackB: 10, intB: 5, recB: 14, aerB: 20, dribB: 2.6, dribRB: 58 },
  },
  "Leandro Brey": {
    2023: { mp: 10, min: 900, g: 0, a: 0, yc: 0, rc: 0, rating: 6.8, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .2, passB: 62, tackB: 2, intB: 1, recB: 4, aerB: 70, dribB: .1, dribRB: 25, saveB: 74, csB: 0.4 },
    2024: { mp: 18, min: 1620, g: 0, a: 0, yc: 1, rc: 0, rating: 7.0, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .2, passB: 64, tackB: 2, intB: 1, recB: 4, aerB: 72, dribB: .1, dribRB: 26, saveB: 76, csB: 0.45 },
    2025: { mp: 28, min: 2520, g: 0, a: 0, yc: 2, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 65, tackB: 2, intB: 1, recB: 5, aerB: 73, dribB: .1, dribRB: 27, saveB: 75, csB: 0.42 },
    2026: { mp: 14, min: 1260, g: 0, a: 0, yc: 1, rc: 0, rating: 7.2, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 66, tackB: 2, intB: 1, recB: 5, aerB: 74, dribB: .1, dribRB: 28, saveB: 78, csB: 0.5 },
  },
  // ── RACING CLUB ──
  "Marco Di Césare": {
    2023: { mp: 18, min: 1530, g: 1, a: 0, yc: 3, rc: 0, rating: 6.9, xgB: .06, shotB: .4, shotOTB: 24, xaB: .03, kpB: .4, passB: 84, tackB: 68, intB: 42, recB: 56, aerB: 62, dribB: .3, dribRB: 34 },
    2024: { mp: 22, min: 1890, g: 2, a: 0, yc: 2, rc: 0, rating: 7.0, xgB: .07, shotB: .4, shotOTB: 26, xaB: .03, kpB: .4, passB: 85, tackB: 72, intB: 44, recB: 58, aerB: 63, dribB: .4, dribRB: 36 },
    2025: { mp: 28, min: 2380, g: 1, a: 1, yc: 4, rc: 0, rating: 7.0, xgB: .06, shotB: .4, shotOTB: 25, xaB: .04, kpB: .5, passB: 85, tackB: 72, intB: 44, recB: 58, aerB: 64, dribB: .4, dribRB: 36 },
    2026: { mp: 10, min: 900, g: 2, a: 0, yc: 4, rc: 1, rating: 7.2, xgB: .08, shotB: .5, shotOTB: 28, xaB: .03, kpB: .4, passB: 84, tackB: 70, intB: 43, recB: 56, aerB: 62, dribB: .3, dribRB: 34 },
  },
  "Juan Nardoni": {
    2023: { mp: 18, min: 1440, g: 2, a: 3, yc: 3, rc: 0, rating: 7.1, xgB: .14, shotB: 1.1, shotOTB: 36, xaB: .22, kpB: 1.6, passB: 84, tackB: 44, intB: 26, recB: 40, aerB: 42, dribB: 1.2, dribRB: 48 },
    2024: { mp: 26, min: 2080, g: 4, a: 5, yc: 4, rc: 0, rating: 7.3, xgB: .18, shotB: 1.3, shotOTB: 38, xaB: .26, kpB: 1.9, passB: 86, tackB: 52, intB: 30, recB: 46, aerB: 44, dribB: 1.4, dribRB: 50 },
    2025: { mp: 28, min: 2250, g: 3, a: 6, yc: 5, rc: 0, rating: 7.2, xgB: .16, shotB: 1.2, shotOTB: 36, xaB: .28, kpB: 2.0, passB: 87, tackB: 54, intB: 32, recB: 48, aerB: 45, dribB: 1.5, dribRB: 51 },
    2026: { mp: 13, min: 1040, g: 1, a: 3, yc: 2, rc: 0, rating: 7.3, xgB: .14, shotB: 1.1, shotOTB: 35, xaB: .26, kpB: 1.9, passB: 87, tackB: 52, intB: 30, recB: 46, aerB: 44, dribB: 1.4, dribRB: 50 },
  },
  "Santiago Sosa": {
    2023: { mp: 20, min: 1640, g: 1, a: 2, yc: 4, rc: 0, rating: 7.0, xgB: .07, shotB: .6, shotOTB: 28, xaB: .12, kpB: 1.0, passB: 88, tackB: 66, intB: 38, recB: 52, aerB: 50, dribB: .6, dribRB: 40 },
    2024: { mp: 24, min: 2050, g: 2, a: 3, yc: 5, rc: 0, rating: 7.1, xgB: .09, shotB: .7, shotOTB: 32, xaB: .16, kpB: 1.2, passB: 89, tackB: 72, intB: 42, recB: 58, aerB: 52, dribB: .7, dribRB: 42 },
    2025: { mp: 26, min: 2180, g: 1, a: 2, yc: 6, rc: 0, rating: 7.0, xgB: .08, shotB: .6, shotOTB: 30, xaB: .14, kpB: 1.1, passB: 88, tackB: 70, intB: 40, recB: 56, aerB: 51, dribB: .6, dribRB: 41 },
    2026: { mp: 12, min: 1020, g: 0, a: 1, yc: 3, rc: 0, rating: 7.0, xgB: .06, shotB: .5, shotOTB: 27, xaB: .12, kpB: 1.0, passB: 88, tackB: 68, intB: 39, recB: 54, aerB: 50, dribB: .5, dribRB: 40 },
  },
  "Ezequiel Unsain": {
    2023: { mp: 30, min: 2700, g: 0, a: 0, yc: 1, rc: 0, rating: 7.0, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 64, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 26, saveB: 74, csB: 0.38 },
    2024: { mp: 32, min: 2880, g: 0, a: 0, yc: 2, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 65, tackB: 2, intB: 1, recB: 5, aerB: 73, dribB: .1, dribRB: 27, saveB: 75, csB: 0.4 },
    2025: { mp: 34, min: 3060, g: 0, a: 0, yc: 1, rc: 0, rating: 7.2, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 66, tackB: 2, intB: 1, recB: 6, aerB: 74, dribB: .1, dribRB: 28, saveB: 76, csB: 0.42 },
    2026: { mp: 14, min: 1260, g: 0, a: 0, yc: 0, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 65, tackB: 2, intB: 1, recB: 5, aerB: 73, dribB: .1, dribRB: 27, saveB: 75, csB: 0.35 },
  },
  "Gabriel Rojas": {
    2023: { mp: 24, min: 1980, g: 1, a: 3, yc: 3, rc: 0, rating: 7.0, xgB: .05, shotB: .5, shotOTB: 26, xaB: .16, kpB: .9, passB: 81, tackB: 50, intB: 27, recB: 42, aerB: 42, dribB: .9, dribRB: 42 },
    2024: { mp: 26, min: 2140, g: 2, a: 4, yc: 4, rc: 0, rating: 7.1, xgB: .06, shotB: .6, shotOTB: 28, xaB: .18, kpB: 1.0, passB: 82, tackB: 54, intB: 30, recB: 45, aerB: 44, dribB: 1.0, dribRB: 44 },
    2025: { mp: 28, min: 2300, g: 1, a: 5, yc: 3, rc: 0, rating: 7.1, xgB: .05, shotB: .5, shotOTB: 26, xaB: .20, kpB: 1.1, passB: 83, tackB: 56, intB: 32, recB: 47, aerB: 45, dribB: 1.0, dribRB: 44 },
    2026: { mp: 13, min: 1040, g: 1, a: 2, yc: 2, rc: 0, rating: 7.1, xgB: .05, shotB: .5, shotOTB: 26, xaB: .18, kpB: 1.0, passB: 82, tackB: 52, intB: 29, recB: 44, aerB: 43, dribB: .9, dribRB: 43 },
  },
  // ── BELGRANO ──
  "Lucas Zelarayán": {
    2023: { mp: 20, min: 1620, g: 10, a: 7, yc: 4, rc: 0, rating: 7.8, xgB: .44, shotB: 2.6, shotOTB: 42, xaB: .42, kpB: 2.8, passB: 84, tackB: 18, intB: 10, recB: 26, aerB: 30, dribB: 2.0, dribRB: 54 },
    2024: { mp: 30, min: 2400, g: 8, a: 9, yc: 5, rc: 0, rating: 7.4, xgB: .32, shotB: 2.1, shotOTB: 38, xaB: .36, kpB: 2.4, passB: 82, tackB: 16, intB: 9, recB: 24, aerB: 28, dribB: 1.8, dribRB: 51 },
    2025: { mp: 24, min: 1820, g: 3, a: 2, yc: 1, rc: 0, rating: 7.1, xgB: .20, shotB: 1.6, shotOTB: 30, xaB: .22, kpB: 1.9, passB: 83, tackB: 14, intB: 7, recB: 20, aerB: 26, dribB: 1.6, dribRB: 49 },
    2026: { mp: 11, min: 844, g: 4, a: 1, yc: 2, rc: 0, rating: 7.3, xgB: .29, shotB: 1.97, shotOTB: 27, xaB: .21, kpB: 1.97, passB: 83, tackB: 12, intB: 6, recB: 18, aerB: 27, dribB: 2.1, dribRB: 52 },
  },
  "Emiliano Rigoni": {
    2023: { mp: 22, min: 1650, g: 6, a: 4, yc: 2, rc: 0, rating: 7.1, xgB: .28, shotB: 2.0, shotOTB: 42, xaB: .24, kpB: 1.8, passB: 73, tackB: 12, intB: 6, recB: 16, aerB: 22, dribB: 2.2, dribRB: 54 },
    2024: { mp: 20, min: 1500, g: 4, a: 3, yc: 2, rc: 0, rating: 7.0, xgB: .24, shotB: 1.8, shotOTB: 40, xaB: .20, kpB: 1.6, passB: 72, tackB: 10, intB: 5, recB: 14, aerB: 20, dribB: 2.0, dribRB: 52 },
    2025: { mp: 18, min: 1380, g: 3, a: 3, yc: 1, rc: 0, rating: 6.9, xgB: .22, shotB: 1.7, shotOTB: 38, xaB: .18, kpB: 1.5, passB: 71, tackB: 9, intB: 5, recB: 13, aerB: 19, dribB: 1.9, dribRB: 50 },
    2026: { mp: 12, min: 789, g: 1, a: 2, yc: 1, rc: 0, rating: 7.0, xgB: .24, shotB: 1.8, shotOTB: 40, xaB: .22, kpB: 1.7, passB: 73, tackB: 10, intB: 5, recB: 14, aerB: 20, dribB: 2.0, dribRB: 52 },
  },
  "Lisandro López": {
    2023: { mp: 26, min: 2200, g: 1, a: 0, yc: 3, rc: 0, rating: 6.9, xgB: .05, shotB: .3, shotOTB: 20, xaB: .02, kpB: .4, passB: 84, tackB: 68, intB: 40, recB: 54, aerB: 65, dribB: .2, dribRB: 30 },
    2024: { mp: 28, min: 2380, g: 2, a: 0, yc: 2, rc: 0, rating: 7.0, xgB: .06, shotB: .4, shotOTB: 22, xaB: .03, kpB: .4, passB: 85, tackB: 70, intB: 42, recB: 56, aerB: 66, dribB: .2, dribRB: 31 },
    2025: { mp: 30, min: 2550, g: 1, a: 1, yc: 3, rc: 0, rating: 7.0, xgB: .05, shotB: .3, shotOTB: 20, xaB: .02, kpB: .4, passB: 85, tackB: 70, intB: 42, recB: 55, aerB: 65, dribB: .2, dribRB: 30 },
    2026: { mp: 8, min: 673, g: 0, a: 1, yc: 2, rc: 0, rating: 7.3, xgB: .04, shotB: .3, shotOTB: 20, xaB: .02, kpB: .4, passB: 85, tackB: 68, intB: 40, recB: 54, aerB: 65, dribB: .2, dribRB: 30 },
  },
  "Lucas Passerini": {
    2023: { mp: 22, min: 1650, g: 8, a: 4, yc: 2, rc: 0, rating: 7.0, xgB: .40, shotB: 2.4, shotOTB: 42, xaB: .16, kpB: 1.0, passB: 68, tackB: 8, intB: 4, recB: 12, aerB: 50, dribB: 1.2, dribRB: 42 },
    2024: { mp: 24, min: 1800, g: 7, a: 5, yc: 3, rc: 0, rating: 7.1, xgB: .38, shotB: 2.3, shotOTB: 40, xaB: .18, kpB: 1.1, passB: 69, tackB: 9, intB: 4, recB: 13, aerB: 51, dribB: 1.3, dribRB: 43 },
    2025: { mp: 20, min: 1540, g: 5, a: 3, yc: 2, rc: 0, rating: 7.0, xgB: .35, shotB: 2.1, shotOTB: 38, xaB: .15, kpB: 1.0, passB: 68, tackB: 8, intB: 4, recB: 12, aerB: 50, dribB: 1.1, dribRB: 41 },
    2026: { mp: 10, min: 760, g: 0, a: 3, yc: 1, rc: 0, rating: 6.9, xgB: .32, shotB: 2.0, shotOTB: 38, xaB: .20, kpB: 1.2, passB: 69, tackB: 8, intB: 4, recB: 12, aerB: 50, dribB: 1.1, dribRB: 42 },
  },
  "Thiago Cardozo": {
    2023: { mp: 28, min: 2520, g: 0, a: 0, yc: 1, rc: 0, rating: 7.0, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 63, tackB: 2, intB: 1, recB: 5, aerB: 71, dribB: .1, dribRB: 26, saveB: 72, csB: 0.35 },
    2024: { mp: 30, min: 2700, g: 0, a: 0, yc: 2, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 64, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 27, saveB: 73, csB: 0.36 },
    2025: { mp: 32, min: 2880, g: 0, a: 0, yc: 1, rc: 0, rating: 7.2, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 65, tackB: 2, intB: 1, recB: 6, aerB: 73, dribB: .1, dribRB: 28, saveB: 74, csB: 0.38 },
    2026: { mp: 13, min: 1170, g: 0, a: 0, yc: 1, rc: 0, rating: 7.8, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 64, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 27, saveB: 76, csB: 0.45 },
  },
  // ── TALLERES ──
  "Guido Herrera": {
    2023: { mp: 34, min: 3060, g: 0, a: 0, yc: 2, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 63, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 26, saveB: 75, csB: 0.38 },
    2024: { mp: 36, min: 3240, g: 0, a: 0, yc: 3, rc: 0, rating: 7.0, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 63, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 26, saveB: 74, csB: 0.35 },
    2025: { mp: 36, min: 3240, g: 0, a: 0, yc: 1, rc: 0, rating: 7.1, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 64, tackB: 2, intB: 1, recB: 5, aerB: 73, dribB: .1, dribRB: 27, saveB: 76, csB: 0.4 },
    2026: { mp: 12, min: 1080, g: 0, a: 0, yc: 1, rc: 0, rating: 7.0, xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .3, passB: 63, tackB: 2, intB: 1, recB: 5, aerB: 72, dribB: .1, dribRB: 26, saveB: 75, csB: 0.38 },
  },
  "Matías Galarza": {
    2024: { mp: 22, min: 1720, g: 1, a: 2, yc: 3, rc: 0, rating: 7.0, xgB: .08, shotB: .6, shotOTB: 28, xaB: .14, kpB: 1.1, passB: 87, tackB: 60, intB: 36, recB: 52, aerB: 48, dribB: .7, dribRB: 42 },
    2025: { mp: 28, min: 2240, g: 2, a: 3, yc: 4, rc: 0, rating: 7.2, xgB: .10, shotB: .7, shotOTB: 30, xaB: .16, kpB: 1.2, passB: 88, tackB: 65, intB: 39, recB: 56, aerB: 50, dribB: .8, dribRB: 44 },
    2026: { mp: 8, min: 657, g: 0, a: 0, yc: 1, rc: 0, rating: 7.4, xgB: .08, shotB: .6, shotOTB: 28, xaB: .14, kpB: 1.1, passB: 89, tackB: 65, intB: 39, recB: 55, aerB: 50, dribB: .7, dribRB: 43 },
  },
  "Valentín Dávila": {
    2025: { mp: 18, min: 900, g: 4, a: 2, yc: 1, rc: 0, rating: 7.1, xgB: .28, shotB: 2.0, shotOTB: 42, xaB: .20, kpB: 1.5, passB: 70, tackB: 8, intB: 4, recB: 12, aerB: 18, dribB: 2.4, dribRB: 56 },
    2026: { mp: 10, min: 403, g: 4, a: 0, yc: 0, rc: 0, rating: 7.4, xgB: .36, shotB: 2.4, shotOTB: 46, xaB: .18, kpB: 1.4, passB: 71, tackB: 8, intB: 4, recB: 12, aerB: 19, dribB: 2.6, dribRB: 58 },
  },
  "Ronaldo Martínez": {
    2023: { mp: 23, min: 1400, g: 3, a: 2, yc: 6, rc: 0, rating: 6.9, xgB: .20, shotB: 1.8, shotOTB: 40, xaB: .12, kpB: .7, passB: 68, tackB: 10, intB: 4, recB: 12, aerB: 44, dribB: .9, dribRB: 40 },
    2024: { mp: 25, min: 1580, g: 3, a: 0, yc: 3, rc: 0, rating: 6.6, xgB: .18, shotB: 1.6, shotOTB: 38, xaB: .08, kpB: .5, passB: 67, tackB: 9, intB: 4, recB: 11, aerB: 43, dribB: .8, dribRB: 39 },
    2025: { mp: 30, min: 2050, g: 10, a: 3, yc: 3, rc: 0, rating: 7.2, xgB: .34, shotB: 2.2, shotOTB: 45, xaB: .14, kpB: .8, passB: 70, tackB: 12, intB: 5, recB: 14, aerB: 46, dribB: 1.1, dribRB: 43 },
    2026: { mp: 11, min: 895, g: 2, a: 1, yc: 1, rc: 0, rating: 6.9, xgB: .22, shotB: 1.7, shotOTB: 41, xaB: .10, kpB: .6, passB: 68, tackB: 10, intB: 4, recB: 12, aerB: 45, dribB: .9, dribRB: 41 },
  },
  // ── INDEPENDIENTE ──
  "Kevin Lomónaco": {
    2023: { mp: 15, min: 1290, g: 0, a: 0, yc: 3, rc: 1, rating: 6.8, xgB: .05, shotB: .3, shotOTB: 22, xaB: .03, kpB: .3, passB: 82, tackB: 60, intB: 36, recB: 50, aerB: 60, dribB: .3, dribRB: 34 },
    2024: { mp: 18, min: 1620, g: 2, a: 0, yc: 1, rc: 0, rating: 7.2, xgB: .07, shotB: .4, shotOTB: 26, xaB: .03, kpB: .4, passB: 84, tackB: 68, intB: 42, recB: 56, aerB: 63, dribB: .4, dribRB: 36 },
    2025: { mp: 15, min: 1350, g: 0, a: 0, yc: 3, rc: 1, rating: 7.0, xgB: .05, shotB: .3, shotOTB: 22, xaB: .02, kpB: .3, passB: 83, tackB: 64, intB: 40, recB: 54, aerB: 61, dribB: .3, dribRB: 34 },
    2026: { mp: 11, min: 970, g: 0, a: 1, yc: 3, rc: 0, rating: 7.3, xgB: .04, shotB: .3, shotOTB: 24, xaB: .08, kpB: .5, passB: 85, tackB: 70, intB: 44, recB: 58, aerB: 64, dribB: .4, dribRB: 36 },
  },
};

// ─── BASE TEMPLATES (Nivel B) ─────────────────────────────────────────────────
interface TPL {
  gRange: [number, number]; aRange: [number, number]; mpRange: [number, number];
  ratingR: [number, number]; xgB: number; shotB: number; shotOTB: number;
  xaB: number; kpB: number; passB: number; tackB: number; intB: number;
  recB: number; aerB: number; dribB: number; dribRB: number;
  saveB?: number; csB?: number;
}
const BASE_TPL: Record<string, TPL> = {
  CF: { gRange: [6, 18], aRange: [1, 6], mpRange: [20, 35], ratingR: [6.6, 7.4], xgB: .48, shotB: 2.8, shotOTB: 43, xaB: .12, kpB: .8, passB: 70, tackB: 9, intB: 4, recB: 12, aerB: 46, dribB: 1.4, dribRB: 44 },
  SS: { gRange: [6, 14], aRange: [4, 10], mpRange: [22, 35], ratingR: [6.7, 7.4], xgB: .38, shotB: 2.2, shotOTB: 40, xaB: .28, kpB: 1.8, passB: 76, tackB: 12, intB: 6, recB: 18, aerB: 32, dribB: 2.0, dribRB: 52 },
  LW: { gRange: [5, 12], aRange: [4, 9], mpRange: [20, 34], ratingR: [6.6, 7.3], xgB: .30, shotB: 2.2, shotOTB: 40, xaB: .28, kpB: 1.8, passB: 73, tackB: 11, intB: 5, recB: 15, aerB: 22, dribB: 2.4, dribRB: 55 },
  RW: { gRange: [5, 12], aRange: [4, 9], mpRange: [20, 34], ratingR: [6.6, 7.3], xgB: .30, shotB: 2.2, shotOTB: 40, xaB: .28, kpB: 1.8, passB: 73, tackB: 11, intB: 5, recB: 15, aerB: 22, dribB: 2.4, dribRB: 55 },
  CAM: { gRange: [4, 10], aRange: [6, 12], mpRange: [20, 34], ratingR: [6.7, 7.3], xgB: .24, shotB: 1.7, shotOTB: 38, xaB: .36, kpB: 2.4, passB: 81, tackB: 14, intB: 8, recB: 22, aerB: 26, dribB: 1.8, dribRB: 50 },
  CM: { gRange: [2, 6], aRange: [4, 8], mpRange: [22, 36], ratingR: [6.7, 7.3], xgB: .12, shotB: .9, shotOTB: 33, xaB: .20, kpB: 1.5, passB: 86, tackB: 44, intB: 24, recB: 38, aerB: 42, dribB: 1.0, dribRB: 44 },
  CDM: { gRange: [0, 3], aRange: [1, 5], mpRange: [22, 36], ratingR: [6.7, 7.2], xgB: .05, shotB: .6, shotOTB: 28, xaB: .10, kpB: .9, passB: 88, tackB: 68, intB: 40, recB: 54, aerB: 52, dribB: .6, dribRB: 40 },
  CB: { gRange: [0, 3], aRange: [0, 2], mpRange: [18, 34], ratingR: [6.6, 7.2], xgB: .06, shotB: .4, shotOTB: 24, xaB: .03, kpB: .4, passB: 84, tackB: 70, intB: 43, recB: 58, aerB: 63, dribB: .3, dribRB: 34 },
  LB: { gRange: [0, 3], aRange: [2, 6], mpRange: [20, 34], ratingR: [6.6, 7.2], xgB: .04, shotB: .5, shotOTB: 26, xaB: .14, kpB: .8, passB: 82, tackB: 52, intB: 28, recB: 42, aerB: 44, dribB: .9, dribRB: 42 },
  RB: { gRange: [0, 3], aRange: [2, 6], mpRange: [20, 34], ratingR: [6.6, 7.2], xgB: .04, shotB: .5, shotOTB: 26, xaB: .14, kpB: .8, passB: 82, tackB: 52, intB: 28, recB: 42, aerB: 44, dribB: .9, dribRB: 42 },
  GK: { gRange: [0, 0], aRange: [0, 1], mpRange: [18, 34], ratingR: [6.5, 7.3], xgB: 0, shotB: 0, shotOTB: 0, xaB: 0, kpB: .2, passB: 62, tackB: 2, intB: 1, recB: 4, aerB: 70, dribB: .1, dribRB: 25, saveB: 72, csB: 0.35 },
};

function genRS(tpl: TPL): RS {
  const mp = rndI(tpl.mpRange[0], tpl.mpRange[1]);
  return {
    mp, min: mp * rndI(70, 90),
    g: rndI(tpl.gRange[0], tpl.gRange[1]),
    a: rndI(tpl.aRange[0], tpl.aRange[1]),
    yc: rndI(1, 7), rc: Math.random() < .08 ? 1 : 0,
    rating: parseFloat(rnd(tpl.ratingR[0], tpl.ratingR[1]).toFixed(1)),
    xgB: tpl.xgB, shotB: tpl.shotB, shotOTB: tpl.shotOTB,
    xaB: tpl.xaB, kpB: tpl.kpB, passB: tpl.passB,
    tackB: tpl.tackB, intB: tpl.intB, recB: tpl.recB,
    aerB: tpl.aerB, dribB: tpl.dribB, dribRB: tpl.dribRB,
    saveB: tpl.saveB, csB: tpl.csB,
  };
}
function buildStat(rs: RS, playerId: number, seasonId: number, mv: string) {
  return {
    playerId, seasonId,
    matchesPlayed: rs.mp, minutesPlayed: rs.min,
    goals: rs.g, assists: rs.a, yellowCards: rs.yc, redCards: rs.rc,
    sofascoreRating: String(rs.rating), marketValueM: mv,
    xgPerGame: vary(rs.xgB), shotsPerGame: vary(rs.shotB),
    shotsOnTargetPct: vary(rs.shotOTB, .10),
    xaPerGame: vary(rs.xaB), keyPassesPerGame: vary(rs.kpB),
    passAccuracyPct: vary(rs.passB, .05),
    tackles: varyI(rs.tackB), interceptions: varyI(rs.intB),
    recoveries: varyI(rs.recB), aerialDuelsWonPct: vary(rs.aerB, .10),
    successfulDribblesPerGame: vary(rs.dribB), dribbleSuccessRate: vary(rs.dribRB, .10),
    savePct: rs.saveB ? vary(rs.saveB, 0.08) : null,
    cleanSheets: rs.csB ? Math.round(rs.mp * (rs.csB + (Math.random() * 0.1 - 0.05))) : null,
    goalsConceded: rs.saveB ? Math.round(rs.mp * (0.8 + Math.random() * 0.6)) : null,
  };
}
function buildRating(rating: number, year: number, playerId: number, seasonId: number) {
  const months = year === 2026 ? ["01", "02", "03", "04"] : ["02", "03", "04", "05", "08", "09", "10", "11"];
  const rBM: Record<string, number> = {};
  months.forEach(m => {
    rBM[`${year}-${m}`] = parseFloat(
      Math.max(5, Math.min(10, rating + Math.random() * .6 - .3)).toFixed(1)
    );
  });
  return { playerId, seasonId, seasonRating: String(rating), ratingByMonth: rBM };
}
function maybeInjury(playerId: number, seasonId: number, year: number, pos: string) {
  const pool = INJTYPES[pos] ?? INJTYPES["CM"];
  if (Math.random() > (year === 2026 ? .20 : .35)) return null;
  const injuryType = pool[rndI(0, pool.length - 1)];
  const offset = rndI(10, 60);
  const dOut = injuryType.includes("Rotura ligamento") ? rndI(150, 270)
    : injuryType.includes("Desgarro") || injuryType.includes("Fractura") ? rndI(21, 55) : rndI(5, 20);
  const start = SEASON_START[year] ?? "2024-01-20";
  return {
    playerId, seasonId, injuryType,
    startedAt: addDays(start, offset),
    returnedAt: addDays(start, offset + dOut),
    daysOut: dOut,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹 Limpiando BD...");
  await db.execute(sql`
    TRUNCATE TABLE player_injuries, player_ratings, player_stats,
                   shortlist_entries, players, seasons, teams, users
    RESTART IDENTITY CASCADE
  `);

  console.log("🌱 Seed — Liga Profesional Argentina (Apertura 2026)...");

  // ── EQUIPOS ──────────────────────────────────────────────────────────────────
  const insertedTeams = await db.insert(teams).values([
    // ── GRUPO A ──────────────────────────────────────────────
    { name: "Vélez Sarsfield", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10079.png" },
    { name: "Estudiantes (LP)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10094.png" },
    { name: "Lanús", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10082.png" },
    { name: "Boca Juniors", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10077.png" },
    { name: "Talleres (C)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10101.png" },
    { name: "Unión (SF)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10096.png" },
    { name: "Defensa y Justicia", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/161730.png" },
    { name: "Independiente", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10078.png" },
    { name: "San Lorenzo", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10083.png" },
    { name: "Instituto (C)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10090.png" },
    { name: "Platense", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10089.png" },
    { name: "Gimnasia y Esgrima (M)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/568727.png" },
    { name: "Newell's Old Boys", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10085.png" },
    { name: "Central Córdoba (SdE)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/213596.png" },
    { name: "Deportivo Riestra", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/298629.png" },
    // ── GRUPO B ──────────────────────────────────────────────
    { name: "Independiente Rivadavia", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/161729.png" },
    { name: "River Plate", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10076.png" },
    { name: "Argentinos Juniors", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10086.png" },
    { name: "Belgrano", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10092.png" },
    { name: "Rosario Central", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10084.png" },
    { name: "Huracán", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10081.png" },
    { name: "Barracas Central", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/213534.png" },
    { name: "Tigre", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/89396.png" },
    { name: "Racing Club", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10080.png" },
    { name: "Gimnasia (LP)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10103.png" },
    { name: "Sarmiento (J)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/202757.png" },
    { name: "Banfield", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/10087.png" },
    { name: "Atlético Tucumán", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/161727.png" },
    { name: "Aldosivi", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/161728.png" },
    { name: "Estudiantes (RC)", country: "Argentina", logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/213591.png" },
  ]).returning();

  const teamMap: Record<string, typeof insertedTeams[0]> = {};
  insertedTeams.forEach(t => { teamMap[t.name] = t; });

  // ── TEMPORADAS ────────────────────────────────────────────────────────────────
  const insertedSeasons = await db.insert(seasons).values([
    { name: "2023", year: 2023 }, { name: "2024", year: 2024 },
    { name: "2025", year: 2025 }, { name: "2026", year: 2026 },
  ]).returning();
  const seasonMap: Record<number, typeof insertedSeasons[0]> = {};
  insertedSeasons.forEach(s => { seasonMap[s.year] = s; });

  // ─────────────────────────────────────────────────────────────────────────────
  // JUGADORES — todos activos en Liga Profesional Apertura 2026
  // fm(ID) → images.fotmob.com/image_resources/playerimages/{ID}.png
  // ─────────────────────────────────────────────────────────────────────────────
  const allPlayersData = [

    // ══════════════════ RIVER PLATE (5) ══════════════════
    { name: "Facundo Colidio", position: "LW", marketValueM: "6.00", dateOfBirth: "2000-01-04", heightCm: 179, weightKg: 68, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["River Plate"].id, debutYear: 2022, photoUrl: fm(949735) },
    { name: "Lucas Martínez Quarta", position: "CB", marketValueM: "9.00", dateOfBirth: "1996-05-10", heightCm: 183, weightKg: 79, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["River Plate"].id, debutYear: 2016, photoUrl: fm(638771) },
    { name: "Pablo Solari", position: "LW", marketValueM: "7.00", dateOfBirth: "2001-10-18", heightCm: 180, weightKg: 75, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["River Plate"].id, debutYear: 2021, photoUrl: fm(1201406) },
    { name: "Sebastián Driussi", position: "CF", marketValueM: "4.50", dateOfBirth: "1996-02-09", heightCm: 175, weightKg: 70, preferredFoot: "Both", nationality: "Argentina", teamId: teamMap["River Plate"].id, debutYear: 2013, photoUrl: fm(510698) },
    { name: "Gonzalo Montiel", position: "RB", marketValueM: "4.50", dateOfBirth: "1997-01-01", heightCm: 177, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["River Plate"].id, debutYear: 2016, photoUrl: fm(687008) },

    // ══════════════════ BOCA JUNIORS (5) ══════════════════
    { name: "Miguel Merentiel", position: "CF", marketValueM: "8.00", dateOfBirth: "1996-02-24", heightCm: 176, weightKg: 70, preferredFoot: "Right", nationality: "Uruguay", teamId: teamMap["Boca Juniors"].id, debutYear: 2023, photoUrl: fm(826418) },
    { name: "Kevin Zenón", position: "LW", marketValueM: "4.40", dateOfBirth: "2001-07-30", heightCm: 181, weightKg: 72, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Boca Juniors"].id, debutYear: 2023, photoUrl: fm(1201039) },
    { name: "Cristian Medina", position: "CM", marketValueM: "8.00", dateOfBirth: "2001-06-18", heightCm: 178, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Boca Juniors"].id, debutYear: 2020, photoUrl: fm(1199960) },
    { name: "Exequiel Zeballos", position: "LW", marketValueM: "7.00", dateOfBirth: "2002-04-24", heightCm: 172, weightKg: 65, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Boca Juniors"].id, debutYear: 2020, photoUrl: fm(1110044) },
    { name: "Leandro Brey", position: "GK", marketValueM: "3.00", dateOfBirth: "2000-08-07", heightCm: 191, weightKg: 84, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Boca Juniors"].id, debutYear: 2022, photoUrl: fm(1201672) },

    // ══════════════════ RACING CLUB (5) ══════════════════
    { name: "Marco Di Césare", position: "CB", marketValueM: "9.00", dateOfBirth: "2002-01-30", heightCm: 186, weightKg: 82, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Racing Club"].id, debutYear: 2021, photoUrl: fm(1209398) },
    { name: "Juan Nardoni", position: "CM", marketValueM: "11.00", dateOfBirth: "2002-05-21", heightCm: 183, weightKg: 78, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Racing Club"].id, debutYear: 2021, photoUrl: fm(1087773) },
    { name: "Santiago Sosa", position: "CDM", marketValueM: "8.00", dateOfBirth: "1999-05-03", heightCm: 182, weightKg: 78, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Racing Club"].id, debutYear: 2018, photoUrl: fm(958860) },
    { name: "Ezequiel Unsain", position: "GK", marketValueM: "4.00", dateOfBirth: "1995-06-28", heightCm: 189, weightKg: 83, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Racing Club"].id, debutYear: 2016, photoUrl: fm(723492) },
    { name: "Gabriel Rojas", position: "RB", marketValueM: "5.00", dateOfBirth: "1997-02-25", heightCm: 174, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Racing Club"].id, debutYear: 2018, photoUrl: fm(805540) },

    // ══════════════════ INDEPENDIENTE (5) ══════════════════
    { name: "Kevin Lomónaco", position: "CB", marketValueM: "12.00", dateOfBirth: "2002-01-08", heightCm: 187, weightKg: 81, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Independiente"].id, debutYear: 2021, photoUrl: fm(1206583) },
    { name: "Luciano Cabral", position: "CAM", marketValueM: "4.50", dateOfBirth: "2000-03-15", heightCm: 175, weightKg: 70, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Independiente"].id, debutYear: 2020, photoUrl: fm(527862) },
    { name: "Ignacio Pussetto", position: "RW", marketValueM: "4.00", dateOfBirth: "1997-03-25", heightCm: 172, weightKg: 69, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Independiente"].id, debutYear: 2016, photoUrl: fm(470847) },
    { name: "Iván Marcone", position: "CDM", marketValueM: "2.50", dateOfBirth: "1992-06-17", heightCm: 181, weightKg: 77, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Independiente"].id, debutYear: 2012, photoUrl: fm(157868) },
    { name: "Gabriel Ávalos", position: "CF", marketValueM: "3.50", dateOfBirth: "1995-04-27", heightCm: 180, weightKg: 75, preferredFoot: "Right", nationality: "Paraguay", teamId: teamMap["Independiente"].id, debutYear: 2015, photoUrl: fm(576154) },

    // ══════════════════ BELGRANO (5) ══════════════════
    { name: "Lucas Zelarayán", position: "CAM", marketValueM: "4.50", dateOfBirth: "1992-06-20", heightCm: 172, weightKg: 70, preferredFoot: "Right", nationality: "Armenia", teamId: teamMap["Belgrano"].id, debutYear: 2011, photoUrl: fm(322965) },
    { name: "Emiliano Rigoni", position: "LW", marketValueM: "1.50", dateOfBirth: "1993-02-04", heightCm: 180, weightKg: 74, preferredFoot: "Both", nationality: "Argentina", teamId: teamMap["Belgrano"].id, debutYear: 2013, photoUrl: fm(371543) },
    { name: "Lisandro López", position: "CB", marketValueM: "0.80", dateOfBirth: "1989-09-01", heightCm: 188, weightKg: 80, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Belgrano"].id, debutYear: 2010, photoUrl: fm(182456) },
    { name: "Lucas Passerini", position: "CF", marketValueM: "1.20", dateOfBirth: "1994-09-12", heightCm: 189, weightKg: 82, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Belgrano"].id, debutYear: 2016, photoUrl: fm(564614) },
    { name: "Thiago Cardozo", position: "GK", marketValueM: "2.50", dateOfBirth: "1995-10-17", heightCm: 183, weightKg: 84, preferredFoot: "Right", nationality: "Uruguay", teamId: teamMap["Belgrano"].id, debutYear: 2017, photoUrl: fm(643566) },

    // ══════════════════ TALLERES (5) ══════════════════
    { name: "Guido Herrera", position: "GK", marketValueM: "2.50", dateOfBirth: "1991-08-25", heightCm: 192, weightKg: 87, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Talleres (C)"].id, debutYear: 2013, photoUrl: fm(358714) },
    { name: "Matías Galarza", position: "CDM", marketValueM: "4.00", dateOfBirth: "2002-03-04", heightCm: 180, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Talleres (C)"].id, debutYear: 2022, photoUrl: fm(1277340) },
    { name: "José Luis Palomino", position: "CB", marketValueM: "1.00", dateOfBirth: "1990-01-05", heightCm: 183, weightKg: 79, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Talleres (C)"].id, debutYear: 2010, photoUrl: fm(185625) },
    { name: "Valentín Dávila", position: "RW", marketValueM: "3.50", dateOfBirth: "2006-07-14", heightCm: 174, weightKg: 68, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Talleres (C)"].id, debutYear: 2025, photoUrl: fm(1695460) },
    { name: "Ronaldo Martínez", position: "CF", marketValueM: "3.50", dateOfBirth: "1996-04-25", heightCm: 178, weightKg: 72, preferredFoot: "Right", nationality: "Paraguay", teamId: teamMap["Talleres (C)"].id, debutYear: 2023, photoUrl: fm(659738) },

    // ══════════════════ INSTITUTO (5) ══════════════════
    { name: "Emanuel Bilbao", position: "GK", marketValueM: "0.80", dateOfBirth: "1993-01-22", heightCm: 188, weightKg: 82, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Instituto (C)"].id, debutYear: 2014, photoUrl: fm(501425) },
    { name: "Alex Luna", position: "CF", marketValueM: "1.50", dateOfBirth: "1996-05-22", heightCm: 177, weightKg: 73, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Instituto (C)"].id, debutYear: 2018, photoUrl: fm(1314218) },
    { name: "Giuliano Cerato", position: "RB", marketValueM: "1.20", dateOfBirth: "2001-09-11", heightCm: 174, weightKg: 68, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Instituto (C)"].id, debutYear: 2021, photoUrl: fm(1098253) },
    { name: "Ignacio Méndez", position: "CAM", marketValueM: "2.00", dateOfBirth: "2001-04-12", heightCm: 175, weightKg: 69, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Instituto (C)"].id, debutYear: 2022, photoUrl: fm(1207421) },
    { name: "Diego Sosa", position: "CB", marketValueM: "1.00", dateOfBirth: "1993-06-30", heightCm: 185, weightKg: 80, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Instituto (C)"].id, debutYear: 2014, photoUrl: fm(867739) },

    // ══════════════════ HURACÁN ══════════════════
    { name: "Jordy Caicedo", position: "CF", marketValueM: "0.80", dateOfBirth: "1997-11-18", heightCm: 185, weightKg: 78, preferredFoot: "Right", nationality: "Ecuador", teamId: teamMap["Huracán"].id, debutYear: 2018, photoUrl: fm(766159) },
    { name: "Leonardo Gil", position: "CM", marketValueM: "1.50", dateOfBirth: "1992-09-30", heightCm: 170, weightKg: 65, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Huracán"].id, debutYear: 2011, photoUrl: fm(469590) },
    { name: "Bruno Barticciotto", position: "RW", marketValueM: "3.00", dateOfBirth: "2002-01-14", heightCm: 176, weightKg: 68, preferredFoot: "Right", nationality: "Chile", teamId: teamMap["Huracán"].id, debutYear: 2022, photoUrl: fm(1128929) },

    // ══════════════════ SAN LORENZO ══════════════════
    { name: "Ezequiel Cerutti", position: "LW", marketValueM: "1.00", dateOfBirth: "1992-06-02", heightCm: 180, weightKg: 74, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["San Lorenzo"].id, debutYear: 2011, photoUrl: fm(469593) },
    { name: "Luciano Vietto", position: "CF", marketValueM: "1.50", dateOfBirth: "1993-12-05", heightCm: 175, weightKg: 70, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["San Lorenzo"].id, debutYear: 2012, photoUrl: fm(294003) },
    { name: "Alexis Cuello", position: "RW", marketValueM: "3.50", dateOfBirth: "2001-03-25", heightCm: 173, weightKg: 67, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["San Lorenzo"].id, debutYear: 2020, photoUrl: fm(989370) },

    // ══════════════════ LANÚS ══════════════════
    { name: "Lautaro Acosta", position: "LW", marketValueM: "1.50", dateOfBirth: "1992-12-27", heightCm: 167, weightKg: 65, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Lanús"].id, debutYear: 2011, photoUrl: fm(46295) },
    { name: "Julio Soler", position: "CM", marketValueM: "4.00", dateOfBirth: "2001-10-05", heightCm: 179, weightKg: 73, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Lanús"].id, debutYear: 2020, photoUrl: fm(1358655) },

    // ══════════════════ DEFENSA Y JUSTICIA ══════════════════
    { name: "Matías Rojas", position: "CAM", marketValueM: "5.00", dateOfBirth: "1997-07-22", heightCm: 176, weightKg: 71, preferredFoot: "Right", nationality: "Paraguay", teamId: teamMap["Defensa y Justicia"].id, debutYear: 2017, photoUrl: fm(623641) },
    { name: "Nicolás Palavecino", position: "CAM", marketValueM: "3.50", dateOfBirth: "1997-04-25", heightCm: 177, weightKg: 72, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Defensa y Justicia"].id, debutYear: 2016, photoUrl: fm(1280806) },

    // ══════════════════ ESTUDIANTES (LP) ══════════════════
    { name: "Gustavo Del Prete", position: "CF", marketValueM: "3.00", dateOfBirth: "1997-04-04", heightCm: 181, weightKg: 77, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Estudiantes (LP)"].id, debutYear: 2018, photoUrl: fm(848182) },
    { name: "Javier Altamirano", position: "CM", marketValueM: "3.50", dateOfBirth: "1999-08-21", heightCm: 173, weightKg: 68, preferredFoot: "Left", nationality: "Chile", teamId: teamMap["Estudiantes (LP)"].id, debutYear: 2021, photoUrl: fm(842894) },

    // ══════════════════ ROSARIO CENTRAL ══════════════════
    { name: "Adrián Martínez", position: "CF", marketValueM: "4.50", dateOfBirth: "1997-07-04", heightCm: 180, weightKg: 76, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Rosario Central"].id, debutYear: 2018, photoUrl: fm(882933) },
    { name: "Ignacio Malcorra", position: "CM", marketValueM: "2.00", dateOfBirth: "1993-12-07", heightCm: 183, weightKg: 77, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Rosario Central"].id, debutYear: 2013, photoUrl: fm(362229) },

    // ══════════════════ NEWELL'S OLD BOYS ══════════════════
    { name: "Tomás Pérez", position: "CM", marketValueM: "3.50", dateOfBirth: "1998-02-28", heightCm: 176, weightKg: 70, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Newell's Old Boys"].id, debutYear: 2017, photoUrl: fm(1485764) },
    { name: "Ramiro Funes Mori", position: "CB", marketValueM: "1.50", dateOfBirth: "1991-03-05", heightCm: 188, weightKg: 82, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Newell's Old Boys"].id, debutYear: 2009, photoUrl: fm(213878) },

    // ══════════════════ ATLÉTICO TUCUMÁN ══════════════════
    { name: "Ramiro Ruiz Rodríguez", position: "RW", marketValueM: "3.00", dateOfBirth: "1998-11-22", heightCm: 172, weightKg: 68, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Atlético Tucumán"].id, debutYear: 2018, photoUrl: fm(939335) },

    // ══════════════════ ARGENTINOS JUNIORS ══════════════════
    { name: "Alan Lescano", position: "CAM", marketValueM: "5.00", dateOfBirth: "2002-01-22", heightCm: 175, weightKg: 69, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Argentinos Juniors"].id, debutYear: 2021, photoUrl: fm(1342579) },
    { name: "Cecilio Domínguez", position: "RW", marketValueM: "3.00", dateOfBirth: "1995-04-27", heightCm: 167, weightKg: 64, preferredFoot: "Left", nationality: "Paraguay", teamId: teamMap["Argentinos Juniors"].id, debutYear: 2014, photoUrl: fm(301391) },

    // ══════════════════ VÉLEZ SARSFIELD ══════════════════
    { name: "Braian Cufré", position: "LB", marketValueM: "4.00", dateOfBirth: "1997-07-05", heightCm: 178, weightKg: 74, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Vélez Sarsfield"].id, debutYear: 2018, photoUrl: fm(684991) },
    { name: "Lucas Janson", position: "LW", marketValueM: "2.50", dateOfBirth: "1993-04-04", heightCm: 178, weightKg: 74, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Vélez Sarsfield"].id, debutYear: 2013, photoUrl: fm(360797) },

    // ══════════════════ GIMNASIA (LP) ══════════════════
    { name: "Maximiliano Coronel", position: "SS", marketValueM: "2.50", dateOfBirth: "2000-05-07", heightCm: 178, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Gimnasia (LP)"].id, debutYear: 2020, photoUrl: fm(182600) },

    // ══════════════════ BANFIELD ══════════════════
    { name: "Fabián Noguera", position: "CB", marketValueM: "2.00", dateOfBirth: "1997-11-10", heightCm: 185, weightKg: 80, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Banfield"].id, debutYear: 2017, photoUrl: fm(529208) },
    { name: "Adrián Spörle", position: "LB", marketValueM: "4.00", dateOfBirth: "1998-03-19", heightCm: 179, weightKg: 72, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Banfield"].id, debutYear: 2018, photoUrl: fm(743009) },

    // ══════════════════ PLATENSE ══════════════════
    { name: "Gastón Hernández", position: "CM", marketValueM: "2.00", dateOfBirth: "1999-03-19", heightCm: 177, weightKg: 72, preferredFoot: "Right", nationality: "Argentina", teamId: teamMap["Platense"].id, debutYear: 2019, photoUrl: fm(1144961) },
    { name: "Jonathan Fabbro", position: "LW", marketValueM: "1.00", dateOfBirth: "1993-12-07", heightCm: 174, weightKg: 70, preferredFoot: "Left", nationality: "Argentina", teamId: teamMap["Platense"].id, debutYear: 2013, photoUrl: fm(96815) },
  ];

  const insertedPlayers = await db.insert(players).values(allPlayersData).returning();

  // ── STATS + RATINGS + INJURIES ────────────────────────────────────────────
  const statsData: (typeof playerStats.$inferInsert)[] = [];
  const ratingsData: (typeof playerRatings.$inferInsert)[] = [];
  const injuriesData: (typeof playerInjuries.$inferInsert)[] = [];

  for (const player of insertedPlayers) {
    const realMap = REAL[player.name];
    const tpl = BASE_TPL[player.position] ?? BASE_TPL["CM"];

    for (const season of insertedSeasons) {
      if (season.year < (player.debutYear ?? 2010)) continue;
      const rs: RS = realMap?.[season.year] ?? genRS(tpl);
      statsData.push(buildStat(rs, player.id, season.id, player.marketValueM ?? "0"));
      ratingsData.push(buildRating(rs.rating, season.year, player.id, season.id));
      const inj = maybeInjury(player.id, season.id, season.year, player.position);
      if (inj) injuriesData.push(inj);
    }
  }

  await db.insert(playerStats).values(statsData);
  await db.insert(playerRatings).values(ratingsData);
  if (injuriesData.length) await db.insert(playerInjuries).values(injuriesData);

  // ── USUARIO DEMO ──────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("123456", 10);
  await db.insert(users).values({
    email: "demo@gmail.com", passwordHash: hash, name: "Scout Demo",
  }).onConflictDoNothing();

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const byTeam: Record<string, number> = {};
  insertedPlayers.forEach(p => {
    const t = insertedTeams.find(t => t.id === p.teamId)?.name ?? "?";
    byTeam[t] = (byTeam[t] ?? 0) + 1;
  });
  console.log("✅ Seed completado:");
  console.log(`   ${insertedTeams.length}   equipos`);
  console.log(`   ${insertedSeasons.length}   temporadas`);
  console.log(`   ${insertedPlayers.length}  jugadores`);
  console.log(`   ${statsData.length}  registros player_stats`);
  console.log(`   ${ratingsData.length}  registros player_ratings`);
  console.log(`   ${injuriesData.length}  registros player_injuries`);
  console.log("\n   Por equipo:");
  /*Object.entries(byTeam).sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`   • ${t.padEnd(22)} ${n}`));*/

  await pool.end();
}

main().catch(err => {
  console.error("❌ Seed falló:", err);
  process.exit(1);
});