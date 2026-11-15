import { normalizeTag } from "@brawl/shared";
import type { BattleLogItem } from "../clients/supercell";

// Confirmem nos logs reais quais tipos as partidas ranqueadas usam.
const RANKED_TYPES = new Set(["soloRanked"]);

type Player = { tag: string; name: string; brawlerId: number; brawlerName: string };

export type ParsedBattle = {
  id: string;
  mapId: number;
  mapName: string;
  mode: string;
  type: string;
  battleTime: Date;
  duration: number | null;
  winningTeam: number | null;
  players: (Player & { team: number })[];
  user: { team: number; brawlerId: number; result: "victory" | "defeat" | "draw" };
};

/** "20261015T183000.000Z" → Date */
export function parseBattleTime(raw: string): Date {
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}:${raw.slice(13)}`;
  return new Date(iso);
}

/** Identificador da partida: o mesmo para todos os 6 jogadores que a têm no log. */
export async function battleHash(battleTime: string, tags: string[]): Promise<string> {
  const input = `${battleTime}|${[...tags].sort().join(",")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  // 16 bytes (32 caracteres hex) bastam para não haver colisão e economizam espaço
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

const smallestTag = (team: Player[]) => team.map((p) => p.tag).sort()[0] ?? "";

export async function parseRankedBattle(
  item: BattleLogItem,
  userTag: string,
): Promise<ParsedBattle | null> {
  const { battle, event } = item;
  if (!battle.type || !RANKED_TYPES.has(battle.type)) return null;
  if (!event.id || !battle.result || !battle.teams || battle.teams.length !== 2) return null;

  const teams: Player[][] = battle.teams.map((team) =>
    team.map((p) => ({
      tag: normalizeTag(p.tag),
      name: p.name,
      brawlerId: p.brawler.id,
      brawlerName: p.brawler.name,
    })),
  );
  // Ordem canônica: o time 0 é sempre o que tem a menor tag.
  teams.sort((a, b) => smallestTag(a).localeCompare(smallestTag(b)));

  const me = normalizeTag(userTag);
  const userTeam = teams.findIndex((team) => team.some((p) => p.tag === me));
  const userPlayer = teams[userTeam]?.find((p) => p.tag === me);
  if (userTeam === -1 || !userPlayer) return null;

  const winningTeam =
    battle.result === "draw" ? null : battle.result === "victory" ? userTeam : 1 - userTeam;
  const players = teams.flatMap((team, index) => team.map((p) => ({ ...p, team: index })));

  return {
    id: await battleHash(item.battleTime, players.map((p) => p.tag)),
    mapId: event.id,
    mapName: event.map ?? "Desconhecido",
    mode: event.mode ?? battle.mode ?? "unknown",
    type: battle.type,
    battleTime: parseBattleTime(item.battleTime),
    duration: battle.duration ?? null,
    winningTeam,
    players,
    user: { team: userTeam, brawlerId: userPlayer.brawlerId, result: battle.result },
  };
}