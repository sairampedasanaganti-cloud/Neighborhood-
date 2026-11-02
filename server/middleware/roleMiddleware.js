/**
 * Role-based authorization. Use after requireAuth.
 * Example: router.get('/admin/stats', requireAuth, requireRole('admin'), handler)
 */
const ApiError = require('../utils/ApiError');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}

function requireVerified(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Authentication required.'));
  if (req.user.verificationStatus !== 'Verified') {
    return next(new ApiError(403, 'Your account must be verified by an admin before doing this.'));
  }
  next();
}

module.exports = { requireRole, requireVerified };
