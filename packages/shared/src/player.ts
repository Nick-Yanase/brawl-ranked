import { z } from "zod";

export const playerSchema = z.object({
  tag: z.string(),
  name: z.string(),
  trophies: z.number(),
  highestTrophies: z.number(),
  expLevel: z.number().optional(),
  "3vs3Victories": z.number().optional(),
  soloVictories: z.number().optional(),
  duoVictories: z.number().optional(),
  club: z.object({ name: z.string().optional() }).optional(),
  brawlers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      power: z.number(),
      rank: z.number(),
      trophies: z.number(),
      highestTrophies: z.number(),
    }),
  ),
});

export type PlayerResponse = z.infer<typeof playerSchema>;