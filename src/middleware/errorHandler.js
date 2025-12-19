const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', err.stack);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Database errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Duplicate entry found';
  } else if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Referenced record not found';
  } else if (err.code === '23502') { // Not null violation
    statusCode = 400;
    message = 'Required field missing';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => e.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;