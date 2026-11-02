/**
 * Runs express-validator checks and converts failures into a 400 ApiError
 * with a clean list of field-level messages.
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(new ApiError(400, messages.join('; ')));
  }
  next();
}

module.exports = validateRequest;
