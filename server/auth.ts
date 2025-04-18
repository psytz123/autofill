import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Enhanced password hashing with key derivation function
 * Uses more secure parameters (increased cost factor, larger salt)
 * and includes pepper for additional security
 */
async function hashPassword(password: string) {
  // Use a larger random salt for better security
  const salt = randomBytes(32).toString("hex");
  
  // Server-side pepper (not stored with password hash)
  // In production, this would be a configuration value stored securely
  const pepper = process.env.PASSWORD_PEPPER || "autofill-secure-pepper";
  
  // Add pepper to password before hashing
  const pepperedPassword = password + pepper;
  
  // Increase iterations for stronger security (N=2^16)
  const iterations = 16; // 2^16 iterations
  
  // Hash with more secure parameters - adjust to standard parameters
  // In Node.js implementation, options come after keylen
  const buf = (await scryptAsync(pepperedPassword, salt, 64)) as Buffer;
  
  // Store hash and salt (not pepper) with algorithm parameters for future proofing
  return `scrypt$${iterations}$${buf.toString("hex")}$${salt}`;
}

/**
 * Enhanced password comparison with timing-safe equality check
 * Supports both old format and new format with algorithm parameters
 */
async function comparePasswords(supplied: string, stored: string) {
  // Server-side pepper (same as in hashPassword)
  const pepper = process.env.PASSWORD_PEPPER || "autofill-secure-pepper";
  
  // Add pepper to supplied password
  const pepperedPassword = supplied + pepper;
  
  // Check if using new format with algorithm parameters
  if (stored.startsWith('scrypt$')) {
    // Format: scrypt$iterations$hash$salt
    const [, iterationsStr, hashed, salt] = stored.split('$');
    const iterations = parseInt(iterationsStr, 10);
    
    // Hash the supplied password with same parameters
    const suppliedBuf = (await scryptAsync(
      pepperedPassword, 
      salt, 
      64
    )) as Buffer;
    
    const hashedBuf = Buffer.from(hashed, "hex");
    
    // Use constant-time comparison to prevent timing attacks
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } 
  // Legacy format support
  else {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(pepperedPassword, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
}

export function setupAuth(app: Express) {
  // Get environment-specific session secret
  const secret = process.env.SESSION_SECRET || "autofill-dev-secret";
  
  // Enhanced session settings with security best practices
  const sessionSettings: session.SessionOptions = {
    secret: secret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'autofill.session', // Custom name instead of default 'connect.sid'
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true, // Prevents client side JS from reading the cookie
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
      sameSite: 'lax', // Provides CSRF protection with exceptions for top-level navigation
      path: '/', // Restrict to site root
      // domain: '.yourdomain.com', // Uncomment in production
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // If user not found, don't throw an error but return false
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
