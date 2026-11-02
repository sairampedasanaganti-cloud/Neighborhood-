const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const { getCoordinatesForCommunity } = require('../utils/coordinates');

/**
 * Register profile after Firebase sign-up completes.
 * Links the Firebase UID to the new MongoDB Community Member profile.
 */
const registerProfile = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, phone, age, city, community, neighborhood, interests, skills, volunteerSkills, availability, location } = req.body;

  const targetUid = req.firebaseUser?.uid;
  const targetEmail = (email || req.firebaseUser?.email || '').toLowerCase().trim();
  const selectedCity = city || 'Chennai';
  const selectedCommunity = community || neighborhood || 'Anna Nagar';

  const defaultCoords = getCoordinatesForCommunity(selectedCommunity, selectedCity);
  const resolvedLocation = {
    address: location?.address || `${selectedCommunity}, ${selectedCity}`,
    lat: location?.lat != null ? Number(location.lat) : defaultCoords.lat,
    lng: location?.lng != null ? Number(location.lng) : defaultCoords.lng,
  };

  let user = await User.findOne({
    $or: [
      ...(targetUid ? [{ firebaseUid: targetUid }] : []),
      ...(targetEmail ? [{ email: targetEmail }] : []),
    ],
  });

  if (user) {
    // Update existing profile
    if (fullName) user.fullName = fullName;
    if (mobile || phone) user.mobile = mobile || phone;
    if (age) user.age = Number(age);
    if (city) user.city = city;
    if (community || neighborhood) user.community = community || neighborhood;
    if (interests) user.interests = interests;
    if (skills || volunteerSkills) user.skills = skills || volunteerSkills;
    if (availability) user.availability = availability;
    if (location) user.location = resolvedLocation;
    await user.save();
    return res.status(200).json({ success: true, data: user });
  }

  user = await User.create({
    firebaseUid: targetUid || `local-${Date.now()}`,
    fullName: fullName || 'Community Member',
    email: targetEmail || `${Date.now()}@neighborlink.local`,
    mobile: mobile || phone || '',
    phone: mobile || phone || '',
    age: age ? Number(age) : 25,
    city: selectedCity,
    community: selectedCommunity,
    neighborhood: selectedCommunity,
    location: resolvedLocation,
    interests: interests || [],
    skills: skills || volunteerSkills || [],
    volunteerSkills: skills || volunteerSkills || [],
    availability: availability || {
      weekdays: ['Evening'],
      weekends: ['Morning', 'Afternoon'],
      status: 'Available',
    },
    verificationStatus: 'Verified',
  });

  res.status(201).json({ success: true, data: user });
});

/**
 * Update full onboarding profile details.
 */
const setupProfile = asyncHandler(async (req, res) => {
  const { fullName, age, city, community, interests, skills, availability, location } = req.body;
  const user = req.user;

  if (fullName && fullName.trim()) user.fullName = fullName.trim();
  if (age !== undefined) user.age = Number(age);
  if (city) user.city = city;
  if (community) user.community = community;
  if (interests) user.interests = interests;
  if (skills) {
    user.skills = skills;
    user.volunteerSkills = skills;
  }
  if (availability) user.availability = availability;
  if (location) {
    user.location = {
      address: location.address || `${community || user.community}, ${city || user.city}`,
      lat: location.lat ?? null,
      lng: location.lng ?? null,
    };
  }
  user.profileCompleted = true;

  await user.save();
  res.json({ success: true, data: user });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = [
    'fullName', 'mobile', 'phone', 'age', 'city', 'community', 'neighborhood',
    'location', 'skills', 'volunteerSkills', 'interests', 'availability', 'profilePicture',
    'emailVerified', 'profileCompleted',
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'age') req.user.age = Number(req.body.age);
      else req.user[field] = req.body[field];
    }
  });

  await req.user.save();
  res.json({ success: true, data: req.user });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Community member not found.');

  // Mask contact info for normal browsing (privacy requirement)
  res.json({ success: true, data: user.toPublicJSON() });
});

/**
 * Helper endpoint for instant testing with seeded demo accounts
 * Generates an authorized session token for demo evaluations.
 */
const demoLogin = asyncHandler(async (req, res) => {
  const { role = 'user', email } = req.body;
  let user;

  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
  } else if (role === 'admin') {
    user = await User.findOne({ role: 'admin' });
  } else if (role === 'senior') {
    user = await User.findOne({ ageGroup: 'senior' });
  } else {
    user = await User.findOne({ role: 'user', ageGroup: { $ne: 'senior' } });
  }

  if (!user) {
    // If the database is freshly started or empty, self-heal by seeding data on demand
    const count = await User.countDocuments();
    if (count === 0) {
      try {
        const { seedData } = require('../seed/seed');
        await seedData();
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });
        } else if (role === 'admin') {
          user = await User.findOne({ role: 'admin' });
        } else if (role === 'senior') {
          user = await User.findOne({ ageGroup: 'senior' });
        } else {
          user = await User.findOne({ role: 'user', ageGroup: { $ne: 'senior' } });
        }
      } catch (seedErr) {
        console.warn('[demoLogin] Self-seed error:', seedErr.message);
      }
    }
  }

  if (!user) {
    throw new ApiError(404, 'Demo user account not found. Please run the seed script first.');
  }

  if (!user.profileCompleted || !user.emailVerified) {
    user.profileCompleted = true;
    user.emailVerified = true;
    await user.save();
  }

  const token = jwt.sign(
    { uid: user.firebaseUid, id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user,
    },
  });
});

/**
 * Direct Member Login (No external Firebase authentication required).
 * Allows logging in by email or mobile number without third-party auth barriers.
 * Automatically marks emailVerified so users are never blocked on login.
 */
const loginUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, email, mobile } = req.body;
  const input = (emailOrPhone || email || mobile || '').trim();

  if (!input) {
    throw new ApiError(400, 'Please provide an email address or mobile number to log in.');
  }

  const cleanDigits = input.replace(/\D/g, '');
  const isEmail = input.includes('@');

  let query;
  if (isEmail) {
    query = { email: input.toLowerCase() };
  } else if (cleanDigits.length >= 7) {
    query = {
      $or: [
        { mobile: cleanDigits },
        { phone: cleanDigits },
        { email: `${cleanDigits}@neighborlink.user` },
      ],
    };
  } else {
    query = {
      $or: [
        { email: input.toLowerCase() },
        { mobile: input },
        { phone: input },
      ],
    };
  }

  let user = await User.findOne(query);

  if (!user) {
    // Check if database has any users; if empty, seed demo users first
    const count = await User.countDocuments();
    if (count === 0) {
      try {
        const { seedData } = require('../seed/seed');
        await seedData();
        user = await User.findOne(query);
      } catch (seedErr) {
        console.warn('[loginUser] Seed error:', seedErr.message);
      }
    }
  }

  if (!user) {
    // Auto-provision community profile so the member can log in without barriers
    const defaultName = isEmail
      ? input.split('@')[0].replace(/[._-]/g, ' ')
      : `Member ${input.slice(-4)}`;
    const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

    user = await User.create({
      firebaseUid: `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      fullName: capitalizedName,
      email: isEmail ? input.toLowerCase() : `${cleanDigits || Date.now()}@neighborlink.user`,
      mobile: cleanDigits || input,
      phone: cleanDigits || input,
      age: 28,
      ageGroup: 'adult',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      location: { address: 'Anna Nagar, Chennai', lat: 13.0850, lng: 80.2101 },
      role: 'user',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['General Help'],
      interests: ['Community'],
    });
  } else {
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }
  }

  const token = jwt.sign(
    { uid: user.firebaseUid, id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user,
    },
  });
});

/**
 * Save or update FCM web push registration token for authenticated user.
 */
const saveFcmToken = asyncHandler(async (req, res) => {
  const { token, deviceType = 'web' } = req.body;
  if (!token || typeof token !== 'string') {
    throw new ApiError(400, 'A valid registration token string is required.');
  }

  const user = req.user;
  if (!user.fcmTokens) user.fcmTokens = [];

  const existingIdx = user.fcmTokens.findIndex((t) => t.token === token);
  if (existingIdx > -1) {
    user.fcmTokens[existingIdx].updatedAt = new Date();
    user.fcmTokens[existingIdx].deviceType = deviceType;
  } else {
    user.fcmTokens.push({
      token,
      deviceType,
      updatedAt: new Date(),
    });
    // Cap at 10 active tokens per user
    if (user.fcmTokens.length > 10) {
      user.fcmTokens.shift();
    }
  }

  await user.save();
  res.json({ success: true, message: 'FCM push notification token registered.' });
});

/**
 * Remove FCM token on logout or permission revocation.
 */
const removeFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (token && req.user.fcmTokens) {
    req.user.fcmTokens = req.user.fcmTokens.filter((t) => t.token !== token);
    await req.user.save();
  }
  res.json({ success: true, message: 'FCM token removed successfully.' });
});

module.exports = {
  registerProfile,
  setupProfile,
  getMe,
  updateMe,
  getPublicProfile,
  demoLogin,
  loginUser,
  saveFcmToken,
  removeFcmToken,
};

