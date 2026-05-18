export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode || 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

