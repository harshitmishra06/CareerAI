/**
 * Standard API Response Envelope
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined && data !== null) {
      this.data = data;
    }
    if (meta) {
      this.meta = meta;
    }
  }

  static success(res, statusCode = 200, data = null, message = 'Success', meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
  }
}
