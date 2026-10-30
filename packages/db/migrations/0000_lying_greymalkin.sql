CREATE TABLE "battle_players" (
	"battle_id" text NOT NULL,
	"team" smallint NOT NULL,
	"player_tag" text NOT NULL,
	"player_name" text NOT NULL,
	"brawler_id" integer NOT NULL,
	CONSTRAINT "battle_players_battle_id_player_tag_pk" PRIMARY KEY("battle_id","player_tag")
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" integer NOT NULL,
	"mode" text NOT NULL,
	"type" text NOT NULL,
	"battle_time" timestamp with time zone NOT NULL,
	"duration" integer,
	"winning_team" smallint
);
--> statement-breakpoint
CREATE TABLE "brawlers" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "map_brawler_stats" (
	"map_id" integer NOT NULL,
	"brawler_id" integer NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "map_brawler_stats_map_id_brawler_id_pk" PRIMARY KEY("map_id","brawler_id")
);
--> statement-breakpoint
CREATE TABLE "map_matchup_stats" (
	"map_id" integer NOT NULL,
	"brawler_id" integer NOT NULL,
	"enemy_id" integer NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "map_matchup_stats_map_id_brawler_id_enemy_id_pk" PRIMARY KEY("map_id","brawler_id","enemy_id")
);
--> statement-breakpoint
CREATE TABLE "map_trio_stats" (
	"map_id" integer NOT NULL,
	"trio_key" text NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "map_trio_stats_map_id_trio_key_pk" PRIMARY KEY("map_id","trio_key")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"player_tag" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_player_tag_unique" UNIQUE("player_tag")
);
--> statement-breakpoint
CREATE TABLE "user_battles" (
	"user_id" uuid NOT NULL,
	"battle_id" text NOT NULL,
	"team" smallint NOT NULL,
	"brawler_id" integer NOT NULL,
	"result" text NOT NULL,
	CONSTRAINT "user_battles_user_id_battle_id_pk" PRIMARY KEY("user_id","battle_id")
);
--> statement-breakpoint
CREATE TABLE "user_map_brawler_stats" (
	"user_id" uuid NOT NULL,
	"map_id" integer NOT NULL,
	"brawler_id" integer NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "user_map_brawler_stats_user_id_map_id_brawler_id_pk" PRIMARY KEY("user_id","map_id","brawler_id")
);
--> statement-breakpoint
CREATE TABLE "user_map_stats" (
	"user_id" uuid NOT NULL,
	"map_id" integer NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "user_map_stats_user_id_map_id_pk" PRIMARY KEY("user_id","map_id")
);
--> statement-breakpoint
CREATE TABLE "user_map_trio_stats" (
	"user_id" uuid NOT NULL,
	"map_id" integer NOT NULL,
	"trio_key" text NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	CONSTRAINT "user_map_trio_stats_user_id_map_id_trio_key_pk" PRIMARY KEY("user_id","map_id","trio_key")
);
--> statement-breakpoint
ALTER TABLE "battle_players" ADD CONSTRAINT "battle_players_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_players" ADD CONSTRAINT "battle_players_brawler_id_brawlers_id_fk" FOREIGN KEY ("brawler_id") REFERENCES "public"."brawlers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battles" ADD CONSTRAINT "user_battles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battles" ADD CONSTRAINT "user_battles_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battles" ADD CONSTRAINT "user_battles_brawler_id_brawlers_id_fk" FOREIGN KEY ("brawler_id") REFERENCES "public"."brawlers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_map_brawler_stats" ADD CONSTRAINT "user_map_brawler_stats_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_map_stats" ADD CONSTRAINT "user_map_stats_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_map_trio_stats" ADD CONSTRAINT "user_map_trio_stats_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "battles_map_idx" ON "battles" USING btree ("map_id");--> statement-breakpoint
CREATE INDEX "battles_time_idx" ON "battles" USING btree ("battle_time");