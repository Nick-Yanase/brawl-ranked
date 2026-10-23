import { z } from "zod";
import { isValidTag, normalizeTag } from "./tag";

export const profileInputSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(40),
  playerTag: z.string().transform(normalizeTag).refine(isValidTag, "Tag inválida"),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;