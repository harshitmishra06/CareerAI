/**
 * Custom Operational Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    this.code = code || (typeof details === 'string' ? details : undefined);

    Error.captureStackTrace(this, this.constructor);
  }
}
