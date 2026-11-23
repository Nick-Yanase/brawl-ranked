import { type Db, profiles } from "@brawl/db";
import { and, eq, isNull, lt, or } from "drizzle-orm";

export async function getProfile(db: Db, userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return row ?? null;
}

/** Retorna null se o usuário já tiver perfil, inclusive quando dois pedidos chegam ao mesmo tempo. */
export async function createProfile(db: Db, data: { id: string; name: string; playerTag: string }) {
  const [row] = await db.insert(profiles).values(data).onConflictDoNothing().returning();
  return row ?? null;
}

export async function markSynced(db: Db, userId: string) {
  await db.update(profiles).set({ lastSyncedAt: new Date() }).where(eq(profiles.id, userId));
}

export async function listProfilesToSync(db: Db) {
  return db.select({ id: profiles.id, playerTag: profiles.playerTag }).from(profiles);
}

/**
 * Reserva o direito de sincronizar: grava sync_requested_at só se o último pedido tiver mais de
 * `cooldownMs`. É um único UPDATE, então dois pedidos simultâneos nunca passam juntos, e a reserva
 * vale mesmo que a sincronização falhe depois.
 */
export async function claimSync(db: Db, userId: string, cooldownMs: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - cooldownMs);
  const rows = await db
    .update(profiles)
    .set({ syncRequestedAt: new Date() })
    .where(
      and(
        eq(profiles.id, userId),
        or(isNull(profiles.syncRequestedAt), lt(profiles.syncRequestedAt, cutoff)),
      ),
    )
    .returning({ id: profiles.id });
  return rows.length > 0;
}

export type TagToSync = { playerTag: string; userIds: string[] };

/** Agrupa as contas por tag: no cron, cada tag é consultada na Supercell uma vez só. */
export function groupByTag(rows: { id: string; playerTag: string }[]): TagToSync[] {
  const byTag = new Map<string, string[]>();
  for (const row of rows) byTag.set(row.playerTag, [...(byTag.get(row.playerTag) ?? []), row.id]);
  return [...byTag].map(([playerTag, userIds]) => ({ playerTag, userIds }));
}

export async function listTagsToSync(db: Db): Promise<TagToSync[]> {
  const rows = await db.select({ id: profiles.id, playerTag: profiles.playerTag }).from(profiles);
  return groupByTag(rows);
}
