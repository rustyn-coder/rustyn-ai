/**
 * Centralized Error Handler Middleware
 * Catches all errors thrown in route handlers and middleware.
 * Must be registered LAST in the Express middleware chain.
 */

/**
 * Not Found (404) handler
 * Catches requests that don't match any route.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global error handler
 * Express identifies this as an error handler because it has 4 parameters.
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error Handler] ${new Date().toISOString()}`);
  console.error(`  Route: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);

  // Determine status code
  // If the error already has a statusCode attached, use it; otherwise 500
  const statusCode = err.statusCode || err.status || 500;

  // Build the response — never expose internals to the client
  const response = {
    success: false,
    message:
      statusCode === 500
        ? "Internal server error. Please try again later."
        : err.message || "Something went wrong.",
  };

  // Include validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
}

/**
 * Async route wrapper
 * Wraps async route handlers so thrown errors are automatically
 * passed to the error handler via next().
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
