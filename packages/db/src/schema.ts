import {
  index,
  integer,
  pgSchema,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Tabela criada pelo Supabase Auth. Declaramos só o id para poder referenciá-la.
const auth = pgSchema("auth");
export const authUsers = auth.table("users", { id: uuid("id").primaryKey() });

// ---------- Usuários ----------

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  playerTag: text("player_tag").notNull().unique(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Catálogo (preenchido pela BrawlAPI) ----------

export const brawlers = pgTable("brawlers", {
  id: integer("id").primaryKey(), // ex.: 16000000
  name: text("name").notNull(),
  imageUrl: text("image_url"),
});

export const maps = pgTable("maps", {
  id: integer("id").primaryKey(), // ex.: 15000007
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  imageUrl: text("image_url"),
});

// ---------- Partidas ----------

export const battles = pgTable(
  "battles",
  {
    id: text("id").primaryKey(), // hash da partida (deduplicação)
    mapId: integer("map_id")
      .notNull()
      .references(() => maps.id),
    mode: text("mode").notNull(),
    type: text("type").notNull(), // "soloRanked"...
    battleTime: timestamp("battle_time", { withTimezone: true }).notNull(),
    duration: integer("duration"), // segundos
    winningTeam: smallint("winning_team"), // 0, 1 ou null (empate)
  },
  (t) => [index("battles_map_idx").on(t.mapId), index("battles_time_idx").on(t.battleTime)],
);

export const battlePlayers = pgTable(
  "battle_players",
  {
    battleId: text("battle_id")
      .notNull()
      .references(() => battles.id, { onDelete: "cascade" }),
    team: smallint("team").notNull(), // 0 ou 1
    playerTag: text("player_tag").notNull(),
    playerName: text("player_name").notNull(),
    brawlerId: integer("brawler_id")
      .notNull()
      .references(() => brawlers.id),
  },
  (t) => [primaryKey({ columns: [t.battleId, t.playerTag] })],
);

export const userBattles = pgTable(
  "user_battles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    battleId: text("battle_id")
      .notNull()
      .references(() => battles.id, { onDelete: "cascade" }),
    team: smallint("team").notNull(),
    brawlerId: integer("brawler_id")
      .notNull()
      .references(() => brawlers.id),
    result: text("result", { enum: ["victory", "defeat", "draw"] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.battleId] })],
);

// ---------- Estatísticas pré-calculadas (read model) ----------

const counters = {
  games: integer("games").notNull(),
  wins: integer("wins").notNull(),
};

export const userMapStats = pgTable(
  "user_map_stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    mapId: integer("map_id").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.userId, t.mapId] })],
);

export const userMapBrawlerStats = pgTable(
  "user_map_brawler_stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    mapId: integer("map_id").notNull(),
    brawlerId: integer("brawler_id").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.userId, t.mapId, t.brawlerId] })],
);

// trioKey - IDs dos 3 brawlers de um time, em ordem crescente, separados por hífen
export const userMapTrioStats = pgTable(
  "user_map_trio_stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    mapId: integer("map_id").notNull(),
    trioKey: text("trio_key").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.userId, t.mapId, t.trioKey] })],
);

export const mapBrawlerStats = pgTable(
  "map_brawler_stats",
  {
    mapId: integer("map_id").notNull(),
    brawlerId: integer("brawler_id").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.mapId, t.brawlerId] })],
);

export const mapTrioStats = pgTable(
  "map_trio_stats",
  {
    mapId: integer("map_id").notNull(),
    trioKey: text("trio_key").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.mapId, t.trioKey] })],
);

/*
  enemy_id é o ID do brawler inimigo, não a tag do jogador. A tabela compara brawler contra brawler;

  Uma linha map_id 15000007, brawler_id 16000012, enemy_id 16000002, games 40, wins 28 quer dizer: “em Hard Rock Mine, nas 40 partidas em que um Crow enfrentou um time com Bull, o lado do Crow venceu 28”. Qualquer jogador com Crow contra qualquer jogador com Bull entra na mesma conta.
*/
export const mapMatchupStats = pgTable(
  "map_matchup_stats",
  {
    mapId: integer("map_id").notNull(),
    brawlerId: integer("brawler_id").notNull(),
    enemyId: integer("enemy_id").notNull(),
    ...counters,
  },
  (t) => [primaryKey({ columns: [t.mapId, t.brawlerId, t.enemyId] })],
);
