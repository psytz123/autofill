// Add tank_size column to vehicles table if it doesn't exist

import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding tank_size column to vehicles table...");
  
  try {
    // Check if the column already exists
    const client = await pool.connect();
    try {
      const checkResult = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'tank_size'"
      );
      
      if (checkResult.rows.length === 0) {
        // Add the column if it doesn't exist
        console.log("Column doesn't exist. Adding tank_size column...");
        await client.query("ALTER TABLE vehicles ADD COLUMN tank_size integer");
        
        // Default values based on fuel type
        await client.query(`
          UPDATE vehicles SET tank_size = 
            CASE 
              WHEN fuel_type = 'DIESEL' THEN 20
              ELSE 15
            END
        `);
        
        console.log("Successfully added tank_size column and set default values");
      } else {
        console.log("tank_size column already exists");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    // Close connection
    await pool.end();
  }
}

main();