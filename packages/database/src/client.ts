import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 10 });
  const database = drizzle(client, { schema });

  return { client, database };
}

export type Database = ReturnType<typeof createDatabase>["database"];

