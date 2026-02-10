const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const rateLimit = require("express-rate-limit");

// Load environment config (validates env vars on import)
const env = require("./config/env");

// Import routes
const authRoutes = require("./routes/authRoutes");

// Import error handlers
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

// ============================================
// Initialize Express App
// ============================================
const app = express();

// ============================================
// Global Middleware Stack
// ============================================

// 1. Security headers (helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// 2. CORS — allow requests from configured origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin or null origin (Electron file://, server-to-server)
      if (!origin || origin === "null") return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5180",
        "http://localhost:3001",
        "http://127.0.0.1:5180",
        "http://127.0.0.1:3001",
      ];

      // Add configured CORS origin(s)
      if (env.CORS_ORIGIN) {
        if (env.CORS_ORIGIN.includes(",")) {
          env.CORS_ORIGIN.split(",")
            .map((o) => o.trim())
            .filter(Boolean)
            .forEach((o) => allowedOrigins.push(o));
        } else {
          allowedOrigins.push(env.CORS_ORIGIN);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Electron app protocols (file://, app://, custom protocols)
      if (
        origin.startsWith("file://") ||
        origin.startsWith("app://") ||
        origin.startsWith("rustyn://")
      ) {
        return callback(null, true);
      }

      // Allow any *.vercel.app subdomain (for Vercel preview/production deployments)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// 3. Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 5. Rate limiting — protect login from brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"] || "unknown";
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all /api routes
app.use("/api", apiLimiter);

// Apply stricter rate limiter specifically to login
app.use("/api/auth/login", loginLimiter);

// ============================================
// Routes
// ============================================

// Health check (root)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Rustyn AI Backend is running.",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// ============================================
// Error Handling (must be LAST)
// ============================================

// 404 — no route matched
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Start Server (only when run directly, not when imported by Vercel)
// ============================================
if (require.main === module) {
  const PORT = env.PORT;

  app.listen(PORT, () => {});

  // Graceful shutdown
  process.on("SIGINT", () => {
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    process.exit(0);
  });

  process.on("uncaughtException", () => {
    process.exit(1);
  });

  process.on("unhandledRejection", () => {});
}

// Export the Express app for Vercel serverless
module.exports = app;
