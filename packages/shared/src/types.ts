/** Contador base de desempenho: quantos jogos e quantas vitórias. A win rate sai de wins / games. */
export type WinStat = { games: number; wins: number };

/** Desempenho de um brawler (num mapa, pessoal ou da comunidade). */
export type BrawlerStat = WinStat & { brawlerId: number };

/** Desempenho de um time de 3 brawlers; trioKey são os ids ordenados e unidos por "-". */
export type TrioStat = WinStat & { trioKey: string }; // "16000000-16000012-16000045"

/** Confronto num mapa: em quantas partidas o time de brawlerId venceu um time que tinha enemyId. */
export type MatchupStat = WinStat & { brawlerId: number; enemyId: number };

/** Perfil do usuário logado (resposta de GET /me). lastSyncedAt é ISO ou null se nunca sincronizou. */
export type ProfileResponse = {
  id: string;
  name: string;
  playerTag: string;
  lastSyncedAt: string | null;
};

/** Estatísticas do usuário em um mapa: total no mapa, por brawler e por trio que ele usou. */
export type UserMapStats = WinStat & {
  mapId: number;
  brawlers: BrawlerStat[];
  trios: TrioStat[];
};

/** Resposta de GET /me/stats: todos os mapas em que o usuário jogou ranqueada. */
export type MeStatsResponse = { lastSyncedAt: string | null; maps: UserMapStats[] };

/** Estatísticas da comunidade em um mapa (GET /maps/:id/stats); base das sugestões do draft. */
export type CommunityMapStats = {
  mapId: number;
  brawlers: BrawlerStat[];
  trios: TrioStat[];
  matchups: MatchupStat[];
};

/** Resposta de GET /catalog: nomes e imagens de brawlers e mapas, vindos da BrawlAPI. */
export type CatalogResponse = {
  brawlers: { id: number; name: string; imageUrl: string | null }[];
  maps: { id: number; name: string; mode: string; imageUrl: string | null }[];
};
