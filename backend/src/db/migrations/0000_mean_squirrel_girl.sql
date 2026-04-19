CREATE TABLE IF NOT EXISTS "player_injuries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"injury_type" varchar(100) NOT NULL,
	"started_at" date NOT NULL,
	"returned_at" date,
	"days_out" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"season_id" integer,
	"rating_by_month" jsonb NOT NULL,
	"season_rating" numeric(3, 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"season_id" integer,
	"matches_played" smallint DEFAULT 0,
	"minutes_played" integer DEFAULT 0,
	"goals" smallint DEFAULT 0,
	"xg_per_game" numeric(4, 2) DEFAULT '0.00',
	"shots_per_game" numeric(4, 2) DEFAULT '0.00',
	"shots_on_target_pct" numeric(5, 2) DEFAULT '0.00',
	"assists" smallint DEFAULT 0,
	"xa_per_game" numeric(4, 2) DEFAULT '0.00',
	"key_passes_per_game" numeric(4, 2) DEFAULT '0.00',
	"pass_accuracy_pct" numeric(5, 2) DEFAULT '0.00',
	"tackles" smallint DEFAULT 0,
	"interceptions" smallint DEFAULT 0,
	"recoveries" smallint DEFAULT 0,
	"aerial_duels_won_pct" numeric(5, 2) DEFAULT '0.00',
	"successful_dribbles_per_game" numeric(4, 2) DEFAULT '0.00',
	"dribble_success_rate" numeric(5, 2) DEFAULT '0.00',
	"save_pct" numeric(5, 2),
	"clean_sheets" smallint,
	"goals_conceded" smallint,
	"market_value_m" numeric(6, 2),
	"sofascore_rating" numeric(3, 1) DEFAULT '0.0',
	"yellow_cards" smallint DEFAULT 0,
	"red_cards" smallint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"position" varchar(50) NOT NULL,
	"market_value_m" numeric(6, 2),
	"date_of_birth" date,
	"height_cm" smallint,
	"weight_kg" smallint,
	"preferred_foot" varchar(10),
	"nationality" varchar(100),
	"debut_year" integer,
	"photo_url" text,
	"team_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"year" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shortlist_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"note" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"country" varchar(100) NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_injuries" ADD CONSTRAINT "player_injuries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_injuries" ADD CONSTRAINT "player_injuries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortlist_entries" ADD CONSTRAINT "shortlist_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortlist_entries" ADD CONSTRAINT "shortlist_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_injuries_player_idx" ON "player_injuries" ("player_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_stats_player_season_idx" ON "player_stats" ("player_id","season_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shortlist_user_player_unique" ON "shortlist_entries" ("user_id","player_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shortlist_user_idx" ON "shortlist_entries" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");