import { createDatabase } from "../client.js";
import { readEditorialCatalog, seedEditorialCatalog } from "./editorial-catalog.js";

const databaseUrl = process.env["DATABASE_URL"];

if (databaseUrl === undefined) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env before seeding.",
  );
}

const { client, database } = createDatabase(databaseUrl);

try {
  const result = await seedEditorialCatalog(database, readEditorialCatalog());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await client.end();
}

