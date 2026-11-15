import { brawlers, type Db, maps } from "@brawl/db";
import { sql } from "drizzle-orm";

type CatalogBrawler = { id: number; name: string; imageUrl: string | null };
type CatalogMap = { id: number; name: string; mode: string; imageUrl: string | null };

export async function upsertCatalog(db: Db, items: { brawlers: CatalogBrawler[]; maps: CatalogMap[] }) {
  if (items.brawlers.length > 0) {
    await db
      .insert(brawlers)
      .values(items.brawlers)
      .onConflictDoUpdate({
        target: brawlers.id,
        set: { name: sql`excluded.name`, imageUrl: sql`excluded.image_url` },
      });
  }
  if (items.maps.length > 0) {
    await db
      .insert(maps)
      .values(items.maps)
      .onConflictDoUpdate({
        target: maps.id,
        set: { name: sql`excluded.name`, mode: sql`excluded.mode`, imageUrl: sql`excluded.image_url` },
      });
  }
}

export async function getCatalog(db: Db) {
  const [allBrawlers, allMaps] = await Promise.all([
    db.select().from(brawlers),
    db.select().from(maps),
  ]);
  return { brawlers: allBrawlers, maps: allMaps };
}