/**
 * Centralized error handler. Every thrown ApiError (or unexpected error)
 * lands here and is converted into a consistent JSON response.
 */
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (statusCode === 500) {
    console.error('[UnhandledError]', err);
  }

  let userMessage = err.message || 'Internal server error';

  // Translate low-level SSL/TLS and MongoDB connection errors into helpful human-readable guidance
  if (
    userMessage.includes('SSL routines') ||
    userMessage.includes('tlsv1 alert') ||
    userMessage.includes('alert number 80') ||
    userMessage.includes('MongoServerSelectionError') ||
    userMessage.includes('ECONNREFUSED')
  ) {
    userMessage = 'Database connection error: Unable to reach MongoDB Atlas. Switch to offline mode by setting USE_OFFLINE_DB=true in server/.env.';
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
