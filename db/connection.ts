import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema.js";

let dbInstance: any = null;

export function getDb(env?: any) {
  if (dbInstance) return dbInstance;

  // Resolve DATABASE_URL from Hono env or process.env
  const connectionString = (env && env.DATABASE_URL) || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // Detect if Neon database is used (default for Cloudflare deployment in this setup)
  const isNeon = connectionString.includes("neon.tech");

  if (isNeon) {
    const client = neon(connectionString);
    dbInstance = drizzleNeon(client, { schema });
  } else {
    // Fallback to standard Node-Postgres connection pool
    const pool = new pg.Pool({ connectionString });
    dbInstance = drizzleNode(pool, { schema });
  }

  return dbInstance;
}
