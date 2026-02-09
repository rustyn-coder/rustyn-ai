/**
 * Request Validation Middleware
 * Validates and sanitizes login input before it reaches the controller.
 */

/**
 * Validate login request body
 * Ensures username and password are present, are strings, and are trimmed.
 */
function validateLoginInput(req, res, next) {
  const { username, password } = req.body;

  const errors = [];

  // Check username
  if (!username) {
    errors.push('Username is required.');
  } else if (typeof username !== 'string') {
    errors.push('Username must be a string.');
  } else if (username.trim().length === 0) {
    errors.push('Username cannot be empty.');
  } else if (username.trim().length > 100) {
    errors.push('Username must be 100 characters or fewer.');
  }

  // Check password
  if (!password) {
    errors.push('Password is required.');
  } else if (typeof password !== 'string') {
    errors.push('Password must be a string.');
  } else if (password.length === 0) {
    errors.push('Password cannot be empty.');
  } else if (password.length > 256) {
    errors.push('Password must be 256 characters or fewer.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // Sanitize: trim username, leave password as-is
  req.body.username = username.trim();

  next();
}

/**
 * Generic body presence check
 * Ensures req.body is not empty (guards against missing Content-Type header).
 */
function requireBody(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request body is empty. Send JSON with Content-Type: application/json.',
    });
  }
  next();
}

module.exports = {
  validateLoginInput,
  requireBody,
};
