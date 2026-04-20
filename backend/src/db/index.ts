import * as dotenv from "dotenv";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Load .env relative to this file so it works regardless of CWD.
// If DATABASE_URL is already set (Docker / CI), dotenv won't override it.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

export const db = drizzle(pool, { schema });
