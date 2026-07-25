import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "dev.db");

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

function createDb() {
  return new Database(DB_PATH);
}

const sqlite = globalForDb.sqlite ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
