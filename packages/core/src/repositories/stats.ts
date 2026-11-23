import type { Db } from "@brawl/db";
import { sql } from "drizzle-orm";

/** Recalcula as estatísticas pessoais de um usuário ou, sem `userId`, de todos (usado pelo cron). */
export async function refreshUserStats(db: Db, userId?: string) {
  const onlyUser = userId ? sql`where user_id = ${userId}` : sql``;
  const onlyUb = userId ? sql`where ub.user_id = ${userId}` : sql``;

  await db.transaction(async (tx) => {
    await tx.execute(sql`delete from user_map_stats ${onlyUser}`);
    await tx.execute(sql`
      insert into user_map_stats (user_id, map_id, games, wins)
      select ub.user_id, b.map_id, count(*), count(*) filter (where ub.result = 'victory')
      from user_battles ub
      join battles b on b.id = ub.battle_id
      ${onlyUb}
      group by ub.user_id, b.map_id`);

    await tx.execute(sql`delete from user_map_brawler_stats ${onlyUser}`);
    await tx.execute(sql`
      insert into user_map_brawler_stats (user_id, map_id, brawler_id, games, wins)
      select ub.user_id, b.map_id, ub.brawler_id, count(*), count(*) filter (where ub.result = 'victory')
      from user_battles ub
      join battles b on b.id = ub.battle_id
      ${onlyUb}
      group by ub.user_id, b.map_id, ub.brawler_id`);

    await tx.execute(sql`delete from user_map_trio_stats ${onlyUser}`);
    await tx.execute(sql`
      insert into user_map_trio_stats (user_id, map_id, trio_key, games, wins)
      select user_id, map_id, trio_key, count(*), count(*) filter (where won)
      from (
        select ub.user_id, b.map_id, ub.result = 'victory' as won,
               string_agg(bp.brawler_id::text, '-' order by bp.brawler_id) as trio_key
        from user_battles ub
        join battles b on b.id = ub.battle_id
        join battle_players bp on bp.battle_id = ub.battle_id and bp.team = ub.team
        ${onlyUb}
        group by ub.user_id, ub.battle_id, b.map_id, ub.result
      ) t
      group by user_id, map_id, trio_key`);
  });
}

export async function refreshCommunityStats(db: Db) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`delete from map_brawler_stats`);
    await tx.execute(sql`
      insert into map_brawler_stats (map_id, brawler_id, games, wins)
      select b.map_id, bp.brawler_id, count(*), count(*) filter (where bp.team = b.winning_team)
      from battle_players bp
      join battles b on b.id = bp.battle_id
      where b.winning_team is not null
      group by b.map_id, bp.brawler_id`);

    await tx.execute(sql`delete from map_trio_stats`);
    await tx.execute(sql`
      insert into map_trio_stats (map_id, trio_key, games, wins)
      select map_id, trio_key, count(*), count(*) filter (where won)
      from (
        select b.map_id, bp.team = b.winning_team as won,
               string_agg(bp.brawler_id::text, '-' order by bp.brawler_id) as trio_key
        from battle_players bp
        join battles b on b.id = bp.battle_id
        where b.winning_team is not null
        group by b.id, b.map_id, bp.team, b.winning_team
      ) t
      group by map_id, trio_key`);

    await tx.execute(sql`delete from map_matchup_stats`);
    await tx.execute(sql`
      insert into map_matchup_stats (map_id, brawler_id, enemy_id, games, wins)
      select b.map_id, a.brawler_id, e.brawler_id, count(*), count(*) filter (where a.team = b.winning_team)
      from battles b
      join battle_players a on a.battle_id = b.id
      join battle_players e on e.battle_id = b.id and e.team <> a.team
      where b.winning_team is not null
      group by b.map_id, a.brawler_id, e.brawler_id`);
  });
}
