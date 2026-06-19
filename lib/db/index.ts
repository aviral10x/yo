import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | undefined;

/**
 * Lazily-initialised Drizzle client over the Neon serverless HTTP driver.
 *
 * Importing this module never requires DATABASE_URL at build time — the
 * connection is created on first query, so `next build` works without secrets.
 * Use a pooled/websocket driver instead only if you need interactive
 * transactions across multiple statements.
 */
export function getDb(): DB {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle({ client: neon(url), schema, casing: "snake_case" });
  }
  return _db;
}

export { schema };
