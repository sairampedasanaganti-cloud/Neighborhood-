/**
 * Authentication Middleware
 * Supports Firebase ID tokens and fallback JWT tokens for seamless testing.
 * Downstream routes rely on req.user, never on client-supplied IDs.
 */
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'neighborlink_jwt_secure_secret_2024';

async function decodeToken(token) {
  // 1. Try Firebase Admin verification
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email, email_verified: decoded.email_verified, source: 'firebase' };
  } catch (firebaseErr) {
    // 2. Try JWT fallback verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { uid: decoded.uid || decoded.id, email: decoded.email, email_verified: true, source: 'jwt' };
    } catch (jwtErr) {
      throw new ApiError(401, 'Invalid or expired authentication token.');
    }
  }
}

/**
 * Ensures user is authenticated and has a registered MongoDB profile.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or malformed Authorization header.');
  }

  const decoded = await decodeToken(token);

  let user = await User.findOne({
    $or: [
      { firebaseUid: decoded.uid },
      { email: (decoded.email || '').toLowerCase() },
    ],
  });

  if (!user && decoded.uid) {
    // Graceful recovery: if Firebase account exists but DB document was missed, auto-initialize atomically
    try {
      user = await User.findOneAndUpdate(
        { firebaseUid: decoded.uid },
        {
          $setOnInsert: {
            firebaseUid: decoded.uid,
            fullName: decoded.name || 'Community Member',
            email: (decoded.email || `${decoded.uid}@neighborlink.user`).toLowerCase(),
            age: 25,
            city: 'Chennai',
            community: 'Anna Nagar',
            verificationStatus: 'Verified',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (upsertErr) {
      // If another parallel request won the insert race, fetch the existing record
      user = await User.findOne({
        $or: [
          { firebaseUid: decoded.uid },
          { email: (decoded.email || '').toLowerCase() },
        ],
      });
    }
  }

  if (!user) {
    throw new ApiError(404, 'No profile found for this account. Complete registration first.');
  }
  if (user.isSuspended) {
    throw new ApiError(403, `This account has been suspended: ${user.suspensionReason || 'Violation of community guidelines'}`);
  }

  req.user = user;
  req.firebaseUser = decoded;
  next();
});

/**
 * Verifies token without requiring the MongoDB User document to exist yet.
 * Used during the registration onboarding step.
 */
const requireTokenOnly = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or malformed Authorization header.');
  }

  const decoded = await decodeToken(token);
  req.firebaseUser = decoded;
  next();
});

module.exports = { requireAuth, requireTokenOnly, JWT_SECRET };
