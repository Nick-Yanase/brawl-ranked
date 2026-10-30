import { defineConfig } from "drizzle-kit";

// Carrega o .env da raiz em desenvolvimento. No CI as variáveis já vêm do ambiente.
try {
  process.loadEnvFile("../../.env");
} catch {}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  schemaFilter: ["public"], // não mexe no schema auth do Supabase
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT ?? "" },
});
