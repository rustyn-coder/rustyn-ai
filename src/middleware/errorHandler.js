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
  // Log the error (full stack in development, message only in production)
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`\n[Error Handler] ${new Date().toISOString()}`);
  console.error(`  Route: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  if (isDev && err.stack) {
    console.error(`  Stack: ${err.stack}`);
  }

  // Determine status code
  // If the error already has a statusCode attached, use it; otherwise 500
  const statusCode = err.statusCode || err.status || 500;

  // Build the response
  const response = {
    success: false,
    message: statusCode === 500 && !isDev
      ? 'Internal server error. Please try again later.'
      : err.message || 'Something went wrong.',
  };

  // Include stack trace in development only
  if (isDev) {
    response.stack = err.stack;
  }

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
