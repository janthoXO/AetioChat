import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./schema.js";
import { config } from "@/config.js";

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: config.DATABASE_URL,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
