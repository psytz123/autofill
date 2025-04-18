import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { adminUsers, drivers, orderAssignments } from "../shared/admin-schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Creating admin tables...");

  try {
    // Create admin_users table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ admin_users table created or already exists");

    // Create drivers table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        license_plate TEXT NOT NULL,
        vehicle_model TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT true,
        current_location JSONB,
        admin_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ drivers table created or already exists");

    // Create order_assignments table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_assignments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL UNIQUE,
        driver_id INTEGER NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        estimated_pickup_time TIMESTAMP,
        estimated_delivery_time TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'assigned',
        notes TEXT,
        admin_id INTEGER NOT NULL
      )
    `);
    console.log("✅ order_assignments table created or already exists");

    // Check if default admin user exists
    const adminCheck = await db.execute(sql`
      SELECT * FROM admin_users WHERE username = 'admin@autofill.com'
    `);

    // Create default admin user if not exists
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await hashPassword("admin123");
      await db.execute(sql`
        INSERT INTO admin_users (username, password, name, role)
        VALUES ('admin@autofill.com', ${hashedPassword}, 'Admin User', 'admin')
      `);
      console.log("✅ Default admin user created");
      console.log("   Username: admin@autofill.com");
      console.log("   Password: admin123");
    } else {
      console.log("✅ Default admin user already exists");
    }

    console.log("✅ Admin tables setup complete");
  } catch (error) {
    console.error("❌ Error creating admin tables:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error in migration script:", e);
  process.exit(1);
});