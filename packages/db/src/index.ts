import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

export function createDb(url: string, options: { max?: number } = {}) {
  // prepare: false → exigido pelo transaction pooler do Supabase
  const client = postgres(url, { prepare: false, max: options.max ?? 1 });
  const db = drizzle({ client, schema });
  return { db, close: () => client.end() };
}

export type Db = ReturnType<typeof createDb>["db"];
