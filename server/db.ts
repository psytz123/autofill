import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add logging for debugging
console.log("[DB] Connecting to PostgreSQL database");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Log queries for debugging
  connectionTimeoutMillis: 10000 
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
});

export const db = drizzle(pool, { schema });
