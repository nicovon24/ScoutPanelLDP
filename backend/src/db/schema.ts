import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  smallint,
  integer,
  decimal,
  timestamp,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────
// SEASONS
// ─────────────────────────────────────────
export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  year: smallint("year").notNull(),
});

// ─────────────────────────────────────────
// PLAYERS (V4)
// ─────────────────────────────────────────
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(), // CF, SS, CAM, CDM, CB, LB, RB, GK
  marketValueM: decimal("market_value_m", { precision: 6, scale: 2 }),
  dateOfBirth: date("date_of_birth"),
  heightCm: smallint("height_cm"),
  weightKg: smallint("weight_kg"),
  preferredFoot: varchar("preferred_foot", { length: 10 }), // "Left" | "Right" | "Both"
  nationality: varchar("nationality", { length: 100 }),
  debutYear: integer("debut_year"),
  photoUrl: text("photo_url"),
  teamId: integer("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────
// PLAYER_STATS (Métricas V4 — por temporada)
// ─────────────────────────────────────────
export const playerStats = pgTable(
  "player_stats",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
    seasonId: integer("season_id").references(() => seasons.id, { onDelete: "cascade" }),

    // Juego
    matchesPlayed: smallint("matches_played").default(0),
    minutesPlayed: integer("minutes_played").default(0),

    // Ataque
    goals: smallint("goals").default(0),
    xgPerGame: decimal("xg_per_game", { precision: 4, scale: 2 }).default("0.00"),
    shotsPerGame: decimal("shots_per_game", { precision: 4, scale: 2 }).default("0.00"),
    shotsOnTargetPct: decimal("shots_on_target_pct", { precision: 5, scale: 2 }).default("0.00"),

    // Creación
    assists: smallint("assists").default(0),
    xaPerGame: decimal("xa_per_game", { precision: 4, scale: 2 }).default("0.00"),
    keyPassesPerGame: decimal("key_passes_per_game", { precision: 4, scale: 2 }).default("0.00"),
    passAccuracyPct: decimal("pass_accuracy_pct", { precision: 5, scale: 2 }).default("0.00"),

    // Duelos y defensa
    tackles: smallint("tackles").default(0),
    interceptions: smallint("interceptions").default(0),
    recoveries: smallint("recoveries").default(0),
    aerialDuelsWonPct: decimal("aerial_duels_won_pct", { precision: 5, scale: 2 }).default("0.00"),

    // Regates
    successfulDribblesPerGame: decimal("successful_dribbles_per_game", { precision: 4, scale: 2 }).default("0.00"),
    dribbleSuccessRate: decimal("dribble_success_rate", { precision: 5, scale: 2 }).default("0.00"),

    // Arquero (null si no es GK)
    savePct: decimal("save_pct", { precision: 5, scale: 2 }),
    cleanSheets: smallint("clean_sheets"),
    goalsConceded: smallint("goals_conceded"),

    // Rating y disciplina
    marketValueM: decimal("market_value_m", { precision: 6, scale: 2 }), // Histórico
    sofascoreRating: decimal("sofascore_rating", { precision: 3, scale: 1 }).default("0.0"),
    yellowCards: smallint("yellow_cards").default(0),
    redCards: smallint("red_cards").default(0),
  },
  (t) => ({
    playerSeasonIdx: index("player_stats_player_season_idx").on(t.playerId, t.seasonId),
  })
);

// ─────────────────────────────────────────
// PLAYER_RATINGS (Análisis Temporal JSONB)
// ─────────────────────────────────────────
export const playerRatings = pgTable("player_ratings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  seasonId: integer("season_id").references(() => seasons.id, { onDelete: "cascade" }),
  ratingByMonth: jsonb("rating_by_month").notNull(), // { "2024-08": 7.2, "2024-09": 8.1, ... }
  seasonRating: decimal("season_rating", { precision: 3, scale: 1 }),
});

// ─────────────────────────────────────────
// PLAYER_INJURIES (Historial de lesiones)
// ─────────────────────────────────────────
export const playerInjuries = pgTable(
  "player_injuries",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    injuryType: varchar("injury_type", { length: 100 }).notNull(),
    startedAt: date("started_at").notNull(),
    returnedAt: date("returned_at"),
    daysOut: smallint("days_out").notNull(),
  },
  (t) => ({
    playerInjuriesIdx: index("player_injuries_player_idx").on(t.playerId),
  })
);

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

// ─────────────────────────────────────────
// SHORTLIST (favoritos persistidos por usuario)
// ─────────────────────────────────────────
export const shortlistEntries = pgTable(
  "shortlist_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    note: text("note"),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => ({
    userPlayerUnique: uniqueIndex("shortlist_user_player_unique").on(t.userId, t.playerId),
    userIdx: index("shortlist_user_idx").on(t.userId),
  })
);

// ─────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────
export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  playerStats: many(playerStats),
  playerRatings: many(playerRatings),
  playerInjuries: many(playerInjuries),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  stats: many(playerStats),
  ratings: many(playerRatings),
  injuries: many(playerInjuries),
  shortlistEntries: many(shortlistEntries),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, { fields: [playerStats.playerId], references: [players.id] }),
  season: one(seasons, { fields: [playerStats.seasonId], references: [seasons.id] }),
}));

export const playerRatingsRelations = relations(playerRatings, ({ one }) => ({
  player: one(players, { fields: [playerRatings.playerId], references: [players.id] }),
  season: one(seasons, { fields: [playerRatings.seasonId], references: [seasons.id] }),
}));

export const playerInjuriesRelations = relations(playerInjuries, ({ one }) => ({
  player: one(players, { fields: [playerInjuries.playerId], references: [players.id] }),
  season: one(seasons, { fields: [playerInjuries.seasonId], references: [seasons.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  shortlist: many(shortlistEntries),
}));

export const shortlistRelations = relations(shortlistEntries, ({ one }) => ({
  user: one(users, { fields: [shortlistEntries.userId], references: [users.id] }),
  player: one(players, { fields: [shortlistEntries.playerId], references: [players.id] }),
}));
