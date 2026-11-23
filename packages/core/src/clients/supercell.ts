import { normalizeTag, playerSchema } from "@brawl/shared";
import { z } from "zod";

// ---------- Formato de uma partida no battlelog ----------

const battlePlayerSchema = z.object({
  tag: z.string(),
  name: z.string(),
  brawler: z.object({ id: z.number(), name: z.string() }),
});

export const battleLogItemSchema = z.object({
  battleTime: z.string(), // "20261015T183000.000Z"
  event: z.object({
    id: z.number().nullish(), // id do mapa
    mode: z.string().nullish(),
    map: z.string().nullish(),
  }),
  battle: z.object({
    mode: z.string().nullish(),
    type: z.string().nullish(), // "soloRanked", "ranked"...
    result: z.enum(["victory", "defeat", "draw"]).nullish(),
    duration: z.number().nullish(),
    teams: z.array(z.array(battlePlayerSchema)).nullish(),
  }),
});

export type BattleLogItem = z.infer<typeof battleLogItemSchema>;

// ---------- Erro com o status HTTP ----------

export class SupercellApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---------- Client ----------

// baseUrl vem de quem chama (cron: process.env; API: c.env), porque o core não pode usar process
export function createSupercellClient(token: string, baseUrl = "https://bsproxy.royaleapi.dev/v1") {
  async function request(path: string): Promise<unknown> {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new SupercellApiError(res.status, `Supercell API respondeu ${res.status} em ${path}`);
    }
    return res.json();
  }

  // "#2PP0" → "/players/%232PP0"
  const playerPath = (tag: string) => `/players/${encodeURIComponent(normalizeTag(tag))}`;

  return {
    async getPlayer(tag: string) {
      return playerSchema.parse(await request(playerPath(tag)));
    },

    async getBattleLog(tag: string): Promise<BattleLogItem[]> {
      const data = z
        .object({ items: z.array(z.unknown()) })
        .parse(await request(`${playerPath(tag)}/battlelog`));

      // Valida partida por partida: modos com formato diferente (showdown, duelos)
      // são descartados sem derrubar o resto.
      return data.items.flatMap((item) => {
        const parsed = battleLogItemSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    },
  };
}

export type SupercellClient = ReturnType<typeof createSupercellClient>;
