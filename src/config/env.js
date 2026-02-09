const dotenv = require("dotenv");
const path = require("path");

// Attempt to load .env from backend root (works locally, skipped on Vercel)
const envPath = path.resolve(__dirname, "../../.env");
const result = dotenv.config({ path: envPath });

// In production (Vercel), .env file won't exist — that's fine,
// environment variables are injected via the Vercel dashboard.
if (result.error && process.env.NODE_ENV !== "production") {
  // Only warn in non-production if .env is missing
  const fs = require("fs");
  if (!fs.existsSync(envPath)) {
    console.warn(`\n⚠️  No .env file found at: ${envPath}`);
    console.warn(
      "   Environment variables must be set via system env or Vercel dashboard.\n",
    );
  }
}

// Required environment variables
const requiredVars = ["LOGIN_USERNAME", "LOGIN_PASSWORD", "JWT_SECRET"];

// Validate all required environment variables are present
const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables:\n   ${missing.join(", ")}\n`,
  );
  console.error(
    "   Set them in your .env file (local) or Vercel dashboard (production).\n",
  );
  process.exit(1);
}

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Auth credentials
  LOGIN_USERNAME: process.env.LOGIN_USERNAME,
  LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // CORS — support comma-separated origins for flexibility
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5180",

  // Helpers
  isDev: (process.env.NODE_ENV || "development") !== "production",
  isProd: process.env.NODE_ENV === "production",
};

module.exports = env;
