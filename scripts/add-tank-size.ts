// Add tank_size column to vehicles table if it doesn't exist

import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding tank_size column to vehicles table...");
  
  try {
    // Check if the column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'tank_size'
    `);
    
    if (checkResult.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE vehicles ADD COLUMN tank_size integer
      `);
      console.log("Successfully added tank_size column");
    } else {
      console.log("tank_size column already exists");
    }
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    // Close connection
    await pool.end();
  }
}

main();