import { battlePlayers, battles, brawlers, type Db, maps, userBattles } from "@brawl/db";
import { lt } from "drizzle-orm";
import type { ParsedBattle } from "../sync/parse";

const uniqueBy = <T>(items: T[], key: (item: T) => number) => [
  ...new Map(items.map((item) => [key(item), item])).values(),
];

/** Retorna quantas partidas eram novas para este usuário. */
export async function saveBattles(db: Db, userId: string, parsed: ParsedBattle[]): Promise<number> {
  if (parsed.length === 0) return 0;

  return db.transaction(async (tx) => {
    // 1. Mapas e brawlers que ainda não estão no catálogo (o nome bonito vem da BrawlAPI depois)
    await tx
      .insert(maps)
      .values(
        uniqueBy(
          parsed.map((b) => ({ id: b.mapId, name: b.mapName, mode: b.mode })),
          (m) => m.id,
        ),
      )
      .onConflictDoNothing();
    await tx
      .insert(brawlers)
      .values(
        uniqueBy(
          parsed.flatMap((b) => b.players.map((p) => ({ id: p.brawlerId, name: p.brawlerName }))),
          (br) => br.id,
        ),
      )
      .onConflictDoNothing();

    // 2. Partidas e jogadores: repetidas são ignoradas pelo hash
    await tx
      .insert(battles)
      .values(
        parsed.map((b) => ({
          id: b.id,
          mapId: b.mapId,
          mode: b.mode,
          type: b.type,
          battleTime: b.battleTime,
          duration: b.duration,
          winningTeam: b.winningTeam,
        })),
      )
      .onConflictDoNothing();
    await tx
      .insert(battlePlayers)
      .values(
        parsed.flatMap((b) =>
          b.players.map((p) => ({
            battleId: b.id,
            team: p.team,
            playerTag: p.tag,
            playerName: p.name,
            brawlerId: p.brawlerId,
          })),
        ),
      )
      .onConflictDoNothing();

    // 3. Vínculo do usuário com cada partida
    const inserted = await tx
      .insert(userBattles)
      .values(
        parsed.map((b) => ({
          userId,
          battleId: b.id,
          team: b.user.team,
          brawlerId: b.user.brawlerId,
          result: b.user.result,
        })),
      )
      .onConflictDoNothing()
      .returning({ battleId: userBattles.battleId });

    return inserted.length;
  });
}

export async function pruneOldBattles(db: Db, days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await db.delete(battles).where(lt(battles.battleTime, cutoff));
}
