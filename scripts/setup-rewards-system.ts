import { db } from "../server/db";
import { 
  users, 
  pointsTransactions, 
  pointsRewards,
  PointsTransactionType 
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function createPointsRewardsTables() {
  console.log("Creating points and rewards tables...");
  
  // Add points column to users table
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0
  `);
  
  // Create points_transactions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS points_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      balance INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Create points_rewards table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS points_rewards (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      points_cost INTEGER NOT NULL,
      discount_amount INTEGER,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  console.log("Tables created successfully!");
}

async function setupDefaultRewards() {
  console.log("Setting up default rewards...");
  
  const existingRewards = await db.select().from(pointsRewards);
  
  if (existingRewards.length === 0) {
    await db.insert(pointsRewards).values([
      {
        name: "Free Delivery",
        description: "Get a free delivery on your next order",
        type: PointsTransactionType.REDEEM_FREE_DELIVERY,
        pointsCost: 500,
        discountAmount: 100, // 100% discount on delivery
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "10% Off Fuel",
        description: "Get 10% off your next fuel order",
        type: PointsTransactionType.REDEEM_FUEL_DISCOUNT,
        pointsCost: 1000,
        discountAmount: 10, // 10% discount on fuel
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "25% Off Delivery",
        description: "Get 25% off your delivery fee",
        type: PointsTransactionType.REDEEM_DISCOUNT,
        pointsCost: 250,
        discountAmount: 25, // 25% discount on delivery
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
    
    console.log("Default rewards created!");
  } else {
    console.log("Rewards already exist, skipping...");
  }
}

async function main() {
  try {
    await createPointsRewardsTables();
    await setupDefaultRewards();
    console.log("Points rewards system setup complete!");
  } catch (error) {
    console.error("Error setting up points rewards system:", error);
  } finally {
    process.exit(0);
  }
}

main();