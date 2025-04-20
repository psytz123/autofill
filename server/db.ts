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

// Enhanced pool configuration with resilience settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  allowExitOnIdle: false, // Don't allow the pool to exit while we're using it
  maxUses: 7500, // Close and replace a connection after it has been used this many times
  maxLifetimeSeconds: 3600 // Close and replace any connection after it has existed for this many seconds
});

// Enhanced error handling for connection pool
pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
  
  // Log more details about the error
  if (err.code) {
    console.error(`[DB] Error code: ${err.code}`);
  }
  
  if (err.message) {
    console.error(`[DB] Error message: ${err.message}`);
  }
  
  // For specific Neon database admin command errors, attempt to recover
  if (err.code === '57P01' || err.message.includes('terminating connection due to administrator command')) {
    console.info('[DB] Detected admin termination - this is expected with Neon and will auto-recover');
  }
});

// Add a connect event handler to log successful connections
pool.on('connect', (client) => {
  console.log('[DB] New client connected to PostgreSQL');
});

export const db = drizzle(pool, { schema });

// Helper function to check database connection
export async function checkDatabaseConnection() {
  let client;
  try {
    // Get a client from the pool and release it right away
    client = await pool.connect();
    console.log('[DB] Database connection successful');
    return true;
  } catch (err) {
    console.error('[DB] Database connection failed:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Check connection initially
checkDatabaseConnection().catch(err => {
  console.error('[DB] Initial connection check failed:', err);
});
