/** Simple error class carrying an HTTP status code. Thrown from anywhere; caught centrally. */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = ApiError;
