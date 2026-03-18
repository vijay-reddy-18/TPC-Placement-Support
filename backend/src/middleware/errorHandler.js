const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      code: 'NOT_FOUND',
      message: message
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      code: 'DUPLICATE_FIELD',
      field: field,
      message: message
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      code: 'VALIDATION_ERROR',
      message: message,
      fields: Object.keys(err.errors)
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      code: 'INVALID_TOKEN',
      message: message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      code: 'TOKEN_EXPIRED',
      message: message
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      code: 'FILE_TOO_LARGE',
      message: message
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      code: 'UNEXPECTED_FILE',
      message: message
    };
  }

  // Default error
  if (!error.code) {
    error = {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    };
  }

  res.status(error.statusCode || 500).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.field && { field: error.field }),
      ...(error.fields && { fields: error.fields }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;



