import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);

  // In production, mask non-operational 500 server error details
  let message = err.message || 'Internal Server Error';
  if (ENV.NODE_ENV === 'production' && statusCode === 500 && !err.isOperational) {
    message = 'An unexpected internal server error occurred. Please try again later.';
  }

  // Server-side logging for unhandled 5xx server errors
  if (statusCode >= 500 && ENV.NODE_ENV !== 'test') {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  const response = {
    success: false,
    error: {
      code: err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'),
      message: message,
      ...(err.details && { details: err.details }),
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};
