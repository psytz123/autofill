import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Generate a random session secret
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Initialize Express app with security headers
const app = express();

// Security middleware: Set secure headers
app.use((req, res, next) => {
  // Add security headers to prevent common attacks
  res.set({
    // Prevent browser from inferring MIME type (reduces MIME sniffing attacks)
    'X-Content-Type-Options': 'nosniff',
    // Prevent clickjacking attacks by denying iframe embedding
    'X-Frame-Options': 'DENY',
    // Set XSS protection mode on browsers that support it
    'X-XSS-Protection': '1; mode=block',
    // Prevent referring URLs from being sent in plain HTTP
    'Referrer-Policy': 'same-origin'
  });
  next();
});

// Configure express JSON parser with strict options to avoid injection
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// CSRF Protection middleware
const csrfTokens = new Set<string>();
app.use((req, res, next) => {
  // Paths that should be excluded from CSRF protection
  const excludedPaths = [
    // Auth routes
    '/api/login',
    '/api/register',
    '/api/auth',
    // Admin routes - ensure we match all admin paths
    '/admin/',
    // WebSocket path
    '/ws'
  ];
  
  // Helper function to check if the path should be excluded
  const isExcludedPath = (path: string) => {
    return excludedPaths.some(excludedPath => path.startsWith(excludedPath));
  };
  
  // For GET requests, just store the token if provided
  if (req.method === 'GET' && req.headers['x-csrf-token']) {
    csrfTokens.add(req.headers['x-csrf-token'] as string);
    return next();
  }
  
  // Skip CSRF checks for excluded paths
  if (isExcludedPath(req.path)) {
    return next();
  }
  
  // Check CSRF for all other mutating operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] as string;
    
    if (!csrfToken || !csrfTokens.has(csrfToken)) {
      // For API routes, return a JSON error
      if (req.path.startsWith('/api')) {
        res.set('X-CSRF-Valid', 'false');
        return res.status(403).json({ message: 'CSRF token validation failed' });
      }
      // For other routes, redirect to homepage
      else {
        return res.redirect('/');
      }
    }
    
    // For valid tokens, add header and continue
    res.set('X-CSRF-Valid', 'true');
    
    // Clean up old tokens periodically (keep set size manageable)
    if (csrfTokens.size > 1000) {
      const tokensArray = Array.from(csrfTokens);
      csrfTokens.clear();
      tokensArray.slice(Math.max(0, tokensArray.length - 500)).forEach(token => {
        csrfTokens.add(token);
      });
    }
  }
  
  next();
});

// Apply rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
  // Skip rate limiting for trusted networks (like internal services)
  skip: (req) => {
    const ip = req.ip || '';
    // Example: skip for localhost and internal services
    return ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('172.16.');
  }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply stricter rate limiting to auth-related endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after an hour'
});

// Apply to auth-specific routes
app.use('/api/login', authLimiter);
app.use('/api/admin/login', authLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
