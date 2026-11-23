import type { Db } from "@brawl/db";
import type { SupercellClient } from "../clients/supercell";
import { saveBattles } from "../repositories/battles";
import { markSynced } from "../repositories/profiles";
import { refreshUserStats } from "../repositories/stats";
import { type ParsedBattle, parseRankedBattle } from "./parse";

export type SyncDeps = { db: Db; supercell: SupercellClient };
export type SyncResult = { ranked: number; newBattles: number };

/** Baixa o battlelog de uma tag uma vez e grava para todas as contas que a cadastraram. */
export async function syncTag(
  deps: SyncDeps,
  playerTag: string,
  userIds: string[],
): Promise<SyncResult> {
  const log = await deps.supercell.getBattleLog(playerTag);

  const parsed = (await Promise.all(log.map((item) => parseRankedBattle(item, playerTag)))).filter(
    (b): b is ParsedBattle => b !== null,
  );

  let newBattles = 0;
  for (const userId of userIds) {
    const inserted = await saveBattles(deps.db, userId, parsed);
    if (inserted > 0) await refreshUserStats(deps.db, userId);
    await markSynced(deps.db, userId);
    newBattles += inserted;
  }

  return { ranked: parsed.length, newBattles };
}

/** Sincroniza um perfil só (usado pela API). */
export function syncPlayer(deps: SyncDeps, profile: { id: string; playerTag: string }) {
  return syncTag(deps, profile.playerTag, [profile.id]);
}
