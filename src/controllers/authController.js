const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

// Hash all passwords from env on startup so we never compare plaintext at runtime
// Map of lowercase username -> { username (original case), hashedPassword }
const credentialMap = new Map();
let credentialsReady = false;

(async () => {
  try {
    for (const cred of env.LOGIN_CREDENTIALS) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(cred.password, salt);
      credentialMap.set(cred.username.toLowerCase(), {
        username: cred.username,
        hashedPassword: hashed,
      });
    }
    credentialsReady = true;
  } catch (err) {
    process.exit(1);
  }
})();

/**
 * Generate a signed JWT for the given username.
 */
function generateToken(username) {
  return jwt.sign({ username }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * POST /api/auth/login
 *
 * Authenticates the user against credentials stored in environment variables.
 * Returns a JWT on success.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // 1. Check if credentials are ready
    if (!credentialsReady) {
      return res.status(503).json({
        success: false,
        message: "Server is initializing. Please try again in a moment.",
      });
    }

    // 2. Find matching user (case-insensitive)
    const entry = credentialMap.get(username.toLowerCase());
    if (!entry) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // 3. Check password against the bcrypt hash
    const isMatch = await bcrypt.compare(password, entry.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // 4. Generate JWT
    const token = generateToken(entry.username);

    // 5. Decode to get expiry for the client
    const decoded = jwt.decode(token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        tokenType: "Bearer",
        expiresIn: env.JWT_EXPIRES_IN,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        user: {
          username: entry.username,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
}

/**
 * GET /api/auth/verify
 *
 * Verifies that the caller's JWT is still valid.
 * Requires: Authorization: Bearer <token> (handled by auth middleware)
 */
function verify(req, res) {
  return res.status(200).json({
    success: true,
    message: "Token is valid.",
    data: {
      user: {
        username: req.user.username,
      },
      tokenIssuedAt: new Date(req.user.iat * 1000).toISOString(),
      tokenExpiresAt: new Date(req.user.exp * 1000).toISOString(),
    },
  });
}

/**
 * GET /api/auth/profile
 *
 * Returns the authenticated user's profile information.
 * Requires: Authorization: Bearer <token> (handled by auth middleware)
 */
function profile(req, res) {
  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully.",
    data: {
      user: {
        username: req.user.username,
        role: "admin",
      },
      session: {
        issuedAt: new Date(req.user.iat * 1000).toISOString(),
        expiresAt: new Date(req.user.exp * 1000).toISOString(),
      },
    },
  });
}

/**
 * POST /api/auth/logout
 *
 * Stateless logout — instructs the client to discard the token.
 */
function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully. Please discard your token.",
  });
}

module.exports = {
  login,
  verify,
  profile,
  logout,
};
