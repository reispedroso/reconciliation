import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "../../.env" });

const databaseUrl = process.env["DATABASE_URL"];

if (databaseUrl === undefined) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env before using database commands.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});

