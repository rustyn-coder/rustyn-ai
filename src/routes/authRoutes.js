const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { validateLoginInput, requireBody } = require("../middleware/validate");

// ============================================
// PUBLIC ROUTES (no token required)
// ============================================

/**
 * POST /api/auth/login
 * Authenticate user and receive a JWT token.
 *
 * Body: { "username": "<string>", "password": "<string>" }
 * Response: { success, message, data: { token, tokenType, expiresIn, expiresAt, user } }
 */
router.post("/login", requireBody, validateLoginInput, authController.login);

/**
 * GET /api/auth/health
 * Simple health check for the auth service (no auth needed).
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running.",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// PROTECTED ROUTES (valid JWT required)
// ============================================

/**
 * GET /api/auth/verify
 * Verify that the current JWT token is still valid.
 *
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { user, tokenIssuedAt, tokenExpiresAt } }
 */
router.get("/verify", authMiddleware, authController.verify);

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile information.
 *
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { user, session } }
 */
router.get("/profile", authMiddleware, authController.profile);

/**
 * POST /api/auth/logout
 * Logout the current user (stateless — client must discard token).
 *
 * Headers: Authorization: Bearer <token>
 * Response: { success, message }
 */
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
