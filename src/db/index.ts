import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "dev.db");

const client = createClient({
  url: `file:${DB_PATH}`,
});

export const db = drizzle(client, { schema });
