import { z } from "zod";

// A imagem vai direto para um <img src>: só aceitamos https. Qualquer outro valor vira null.
const imageUrl = z.string().url().startsWith("https://").nullish().catch(null);

const brawlerSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl,
  imageUrl2: imageUrl,
});

const mapSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl,
  gameMode: z.object({ name: z.string() }),
});

export function createBrawlApiClient(baseUrl = "https://api.brawlapi.com/v1") {
  async function list<T>(path: string, schema: z.ZodType<T>): Promise<T[]> {
    const res = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`BrawlAPI respondeu ${res.status} em ${path}`);
    const data = z.object({ list: z.array(z.unknown()) }).parse(await res.json());
    return data.list.flatMap((item) => {
      const parsed = schema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  }

  return {
    getBrawlers: () => list("/brawlers", brawlerSchema),
    getMaps: () => list("/maps", mapSchema),
  };
}

export type BrawlApiClient = ReturnType<typeof createBrawlApiClient>;