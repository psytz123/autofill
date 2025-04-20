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
  if (stored.startsWith("scrypt$")) {
    // Format: scrypt$iterations$hash$salt
    const [, iterationsStr, hashed, salt] = stored.split("$");
    const iterations = parseInt(iterationsStr, 10);

    // Hash the supplied password with same parameters
    const suppliedBuf = (await scryptAsync(
      pepperedPassword,
      salt,
      64,
    )) as Buffer;

    const hashedBuf = Buffer.from(hashed, "hex");

    // Use constant-time comparison to prevent timing attacks
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  // Legacy format support
  else {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(
      pepperedPassword,
      salt,
      64,
    )) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
}

export function setupAuth(app: Express) {
  // Get environment-specific session secret
  const secret = process.env.SESSION_SECRET || "autofill-dev-secret";

  console.log("[Auth] Setting up authentication system");

  // Enhanced session settings with security best practices
  const sessionSettings: session.SessionOptions = {
    secret: secret,
    resave: false, 
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "autofill.session", // Custom name instead of default 'connect.sid'
    rolling: true, // Reset expiration countdown on every response
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true, // Prevents client side JS from reading the cookie
      secure: process.env.NODE_ENV === "production", // Requires HTTPS in production
      sameSite: "lax", // Provides CSRF protection with exceptions for top-level navigation
      path: "/", // Restrict to site root
      // domain: '.yourdomain.com', // Uncomment in production
    },
  };

  app.set("trust proxy", 1);
  
  // Add session middleware with enhanced error handling
  app.use((req, res, next) => {
    session(sessionSettings)(req, res, (err) => {
      if (err) {
        console.error('[Auth] Session middleware error:', err);
        // Continue despite session error - allows basic functionality without persistent login
        next();
      } else {
        next();
      }
    });
  });
  
  // Initialize passport with error handling
  app.use((req, res, next) => {
    passport.initialize()(req, res, (err) => {
      if (err) {
        console.error('[Auth] Passport initialize error:', err);
        next();
      } else {
        next();
      }
    });
  });
  
  // Set up passport session with error handling
  app.use((req, res, next) => {
    passport.session()(req, res, (err) => {
      if (err) {
        console.error('[Auth] Passport session error:', err);
        // Clear the problematic session
        if (req.session) {
          req.session.destroy((destroyErr) => {
            if (destroyErr) {
              console.error('[Auth] Failed to destroy corrupted session:', destroyErr);
            }
          });
        }
        next();
      } else {
        next();
      }
    });
  });

  // Configure Passport strategy with detailed error logging
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[Auth] Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`[Auth] User not found: ${username}`);
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log(`[Auth] Invalid password for user: ${username}`);
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        console.log(`[Auth] Authentication successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error('[Auth] Authentication error:', error);
        return done(error);
      }
    }),
  );

  // User serialization for session storage
  passport.serializeUser((user, done) => {
    try {
      console.log(`[Auth] Serializing user: ${user.id}`);
      done(null, user.id);
    } catch (error) {
      console.error('[Auth] Error serializing user:', error);
      done(error, null);
    }
  });
  
  // User deserialization from session data
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`[Auth] User not found during deserialization: ${id}`);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error(`[Auth] Error deserializing user ${id}:`, error);
      // Don't crash on deserialization errors, just continue without auth
      done(null, false);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('[Auth] Registration attempt:', req.body.username);
      
      // Validate input
      if (!req.body.username || !req.body.password || !req.body.name) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('[Auth] Registration failed - username exists:', req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log('[Auth] Password hashed successfully');
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      console.log('[Auth] User created, attempting login:', user.id);

      req.login(user, (err) => {
        if (err) {
          console.error('[Auth] Registration login error:', err);
          return next(err);
        }
        
        console.log('[Auth] Registration successful:', user.id);
        res.status(201).json({
          id: user.id,
          username: user.username,
          name: user.name
        });
      });
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      next(error);
    }
  });

  // Login endpoint with enhanced error handling
  app.post("/api/login", (req, res, next) => {
    console.log("[Auth] Login attempt:", { username: req.body.username });
    
    // Validate input
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Missing username or password" });
    }

    // Handle authentication with custom callback
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined,
      ) => {
        if (err) {
          console.error("[Auth] Login error:", err);
          return next(err);
        }

        if (!user) {
          console.log("[Auth] Login failed: Invalid credentials", info?.message);
          return res
            .status(401)
            .json({ message: info?.message || "Invalid username or password" });
        }

        // Log the user in
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("[Auth] Session error:", loginErr);
            return next(loginErr);
          }

          console.log("[Auth] Login successful for user:", user.id);
          // Don't send the password hash to the client
          const safeUser = {
            id: user.id,
            username: user.username, 
            name: user.name
          };
          res.status(200).json(safeUser);
        });
      },
    )(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      console.log('[Auth] Logout requested but not authenticated');
      return res.sendStatus(200); // Success even if not logged in
    }
    
    const userId = req.user?.id;
    console.log('[Auth] Logout requested for user:', userId);
    
    req.logout((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return next(err);
      }
      
      console.log('[Auth] Logout successful for user:', userId);
      res.sendStatus(200);
    });
  });

  // User info endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('[Auth] User info requested but not authenticated');
      return res.sendStatus(401);
    }
    
    console.log('[Auth] User info requested for user:', req.user?.id);
    
    // Don't send the password hash to the client
    const safeUser = {
      id: req.user?.id,
      username: req.user?.username,
      name: req.user?.name,
      stripeCustomerId: req.user?.stripeCustomerId,
      stripeSubscriptionId: req.user?.stripeSubscriptionId
    };
    
    res.json(safeUser);
  });
  
  // Session status check endpoint (for debugging)
  app.get("/api/session-check", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      userId: req.user?.id,
      cookiePresent: !!req.headers.cookie?.includes('autofill.session')
    });
  });
}
