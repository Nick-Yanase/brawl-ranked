import type { Db } from "@brawl/db";
import type { BrawlApiClient } from "../clients/brawlapi";
import { upsertCatalog } from "../repositories/catalog";

export async function syncCatalog(db: Db, brawlapi: BrawlApiClient) {
  const [brawlers, maps] = await Promise.all([brawlapi.getBrawlers(), brawlapi.getMaps()]);
  await upsertCatalog(db, {
    brawlers: brawlers.map((b) => ({
      id: b.id,
      name: b.name,
      imageUrl: b.imageUrl2 ?? b.imageUrl ?? null,
    })),
    maps: maps.map((m) => ({
      id: m.id,
      name: m.name,
      mode: m.gameMode.name,
      imageUrl: m.imageUrl ?? null,
    })),
  });
  return { brawlers: brawlers.length, maps: maps.length };
}
