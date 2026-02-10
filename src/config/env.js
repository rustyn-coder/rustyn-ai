const dotenv = require("dotenv");
const path = require("path");

// Attempt to load .env from backend root (skipped on Vercel where env vars are injected)
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// Required environment variables
const requiredVars = ["LOGIN_USERNAME", "LOGIN_PASSWORD", "JWT_SECRET"];

// Validate all required environment variables are present
const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  process.exit(1);
}

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || "production",

  // Auth credentials
  LOGIN_USERNAME: process.env.LOGIN_USERNAME,
  LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // CORS — support comma-separated origins for flexibility
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  // Helpers
  isProd: (process.env.NODE_ENV || "production") === "production",
};

module.exports = env;
