import {
  type Db,
  mapBrawlerStats,
  mapMatchupStats,
  mapTrioStats,
  profiles,
  userMapBrawlerStats,
  userMapStats,
  userMapTrioStats,
} from "@brawl/db";
import type { CommunityMapStats, MeStatsResponse } from "@brawl/shared";
import { and, eq, gte } from "drizzle-orm";

export async function getUserStats(db: Db, userId: string): Promise<MeStatsResponse> {
  const [profile, mapRows, brawlerRows, trioRows] = await Promise.all([
    db
      .select({ lastSyncedAt: profiles.lastSyncedAt })
      .from(profiles)
      .where(eq(profiles.id, userId)),
    db.select().from(userMapStats).where(eq(userMapStats.userId, userId)),
    db.select().from(userMapBrawlerStats).where(eq(userMapBrawlerStats.userId, userId)),
    db.select().from(userMapTrioStats).where(eq(userMapTrioStats.userId, userId)),
  ]);

  return {
    lastSyncedAt: profile[0]?.lastSyncedAt?.toISOString() ?? null,
    maps: mapRows.map((m) => ({
      mapId: m.mapId,
      games: m.games,
      wins: m.wins,
      brawlers: brawlerRows
        .filter((b) => b.mapId === m.mapId)
        .map(({ brawlerId, games, wins }) => ({ brawlerId, games, wins })),
      trios: trioRows
        .filter((t) => t.mapId === m.mapId)
        .map(({ trioKey, games, wins }) => ({ trioKey, games, wins })),
    })),
  };
}

export async function getCommunityMapStats(db: Db, mapId: number): Promise<CommunityMapStats> {
  const [brawlerRows, trioRows, matchupRows] = await Promise.all([
    db.select().from(mapBrawlerStats).where(eq(mapBrawlerStats.mapId, mapId)),
    db
      .select()
      .from(mapTrioStats)
      .where(and(eq(mapTrioStats.mapId, mapId), gte(mapTrioStats.games, 3))),
    db
      .select()
      .from(mapMatchupStats)
      .where(and(eq(mapMatchupStats.mapId, mapId), gte(mapMatchupStats.games, 3))),
  ]);

  return {
    mapId,
    brawlers: brawlerRows.map(({ brawlerId, games, wins }) => ({ brawlerId, games, wins })),
    trios: trioRows.map(({ trioKey, games, wins }) => ({ trioKey, games, wins })),
    matchups: matchupRows.map(({ brawlerId, enemyId, games, wins }) => ({
      brawlerId,
      enemyId,
      games,
      wins,
    })),
  };
}
