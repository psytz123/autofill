import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding card_holder column to payment_methods table...");

  try {
    // Check if the column already exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_methods' AND column_name = 'card_holder'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE payment_methods 
        ADD COLUMN IF NOT EXISTS card_holder TEXT
      `);
      console.log("✅ Successfully added card_holder column to payment_methods table");
    } else {
      console.log("✅ card_holder column already exists in payment_methods table");
    }
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error in migration script:", e);
  process.exit(1);
});