DO $$ BEGIN
 CREATE TYPE "public"."contract_type" AS ENUM('PERMANENT', 'LOAN', 'FREE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_career" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"team_name" varchar(150) NOT NULL,
	"team_logo_url" text,
	"year_range" varchar(20) NOT NULL,
	"appearances" smallint DEFAULT 0,
	"goals" smallint DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "player_stats" ADD COLUMN "big_chances_created" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "player_stats" ADD COLUMN "fouls_drawn" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "player_stats" ADD COLUMN "heatmap_data" jsonb;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "contract_type" "contract_type" DEFAULT 'PERMANENT';--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "contract_until" date;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "strengths" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "weaknesses" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_career" ADD CONSTRAINT "player_career_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "player_career_player_idx" ON "player_career" ("player_id");