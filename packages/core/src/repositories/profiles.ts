import { type Db, profiles } from "@brawl/db";
import { eq } from "drizzle-orm";

export async function getProfile(db: Db, userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return row ?? null;
}

export async function createProfile(db: Db, data: { id: string; name: string; playerTag: string }) {
  const [row] = await db.insert(profiles).values(data).returning();
  return row;
}

export async function markSynced(db: Db, userId: string) {
  await db.update(profiles).set({ lastSyncedAt: new Date() }).where(eq(profiles.id, userId));
}

export async function listProfilesToSync(db: Db) {
  return db.select({ id: profiles.id, playerTag: profiles.playerTag }).from(profiles);
}