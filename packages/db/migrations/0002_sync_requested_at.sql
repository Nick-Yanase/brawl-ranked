ALTER TABLE "profiles" DROP CONSTRAINT "profiles_player_tag_unique";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "sync_requested_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "profiles_tag_idx" ON "profiles" USING btree ("player_tag");