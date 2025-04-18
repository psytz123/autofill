import { db } from "../server/db";
import { adminUsers } from "../shared/admin-schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { pool } from "../server/db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log("Creating admin user...");
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
      process.exit(0);
    }
    
    // Create admin with default credentials
    const [admin] = await db.insert(adminUsers).values({
      username: "admin",
      password: await hashPassword("admin123"), // Default password
      name: "Admin User",
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log("Admin user created successfully:", admin);
    console.log("\nDefault admin credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("\nIMPORTANT: Please change the default password after first login!");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

main();