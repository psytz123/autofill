import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { adminUsers, AdminUser } from "../shared/admin-schema";
import { eq } from "drizzle-orm";

// Extend the session type to include adminUserId
declare module 'express-session' {
  interface SessionData {
    adminUserId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAdminAuth(app: Express) {
  // Admin authentication middleware
  app.use("/admin/api/*", async (req, res, next) => {
    if (req.session && req.session.adminUserId) {
      try {
        const [admin] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, req.session.adminUserId));
          
        if (admin) {
          req.adminUser = admin;
          return next();
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  });

  // Admin login route
  app.post("/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find admin user by username
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username));
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await comparePasswords(password, admin.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set admin user id in session
      req.session.adminUserId = admin.id;
      
      // Remove password from response
      const { password: _, ...adminData } = admin;
      
      res.json(adminData);
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });

  // Admin logout route
  app.post("/admin/logout", (req, res) => {
    if (req.session) {
      req.session.adminUserId = undefined;
      res.status(200).json({ message: "Logged out successfully" });
    } else {
      res.status(400).json({ message: "No active session" });
    }
  });

  // Get current admin user
  app.get("/admin/me", async (req, res) => {
    if (req.session && req.session.adminUserId) {
      try {
        const [admin] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, req.session.adminUserId));
          
        if (admin) {
          // Remove password from response
          const { password: _, ...adminData } = admin;
          return res.json(adminData);
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      }
    }
    
    res.status(401).json({ message: "Unauthorized" });
  });
}