// Update tank_size for existing vehicles based on fuel type

import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import { FuelType } from "../shared/schema";

async function main() {
  console.log("Updating default tank sizes for existing vehicles...");
  
  try {
    // Default tank sizes by fuel type
    const defaultTankSizes = {
      [FuelType.REGULAR_UNLEADED]: 15,
      [FuelType.PREMIUM_UNLEADED]: 15,
      [FuelType.DIESEL]: 20,
    };
    
    // Get all vehicles with null tank_size
    const vehiclesResult = await db.execute(sql`
      SELECT id, fuel_type FROM vehicles WHERE tank_size IS NULL
    `);
    
    console.log(`Found ${vehiclesResult.rows.length} vehicles with null tank_size`);
    
    // Update each vehicle with appropriate tank size based on fuel type
    for (const row of vehiclesResult.rows) {
      const id = row.id;
      const fuelType = row.fuel_type as FuelType;
      const tankSize = defaultTankSizes[fuelType] || 15; // Default to 15 if unknown
      
      await db.execute(sql`
        UPDATE vehicles SET tank_size = ${tankSize} WHERE id = ${id}
      `);
      
      console.log(`Updated vehicle id=${id} with fuel_type=${fuelType} to tank_size=${tankSize}`);
    }
    
    console.log("Successfully updated tank sizes for all vehicles");
  } catch (error) {
    console.error("Error updating tank sizes:", error);
  } finally {
    // Close connection
    await pool.end();
  }
}

main();