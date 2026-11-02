/**
 * User model — Community Member profile.
 * Every registered person is a Community Member.
 * Age determines appropriate interface and available request categories.
 */
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    weekdays: {
      type: [String],
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: ['Evening'],
    },
    weekends: {
      type: [String],
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: ['Morning', 'Afternoon'],
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'Unavailable'],
      default: 'Available',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, trim: true, default: '', index: true },
    phone: { type: String, trim: true, default: '' }, // legacy alias for mobile
    passwordHash: { type: String, default: '' },

    age: {
      type: Number,
      default: 25,
      min: 10,
      max: 120,
      set: function (val) {
        if (val >= 10 && val <= 17) this.ageGroup = 'teenager';
        else if (val >= 18 && val <= 25) this.ageGroup = 'young_adult';
        else if (val >= 26 && val <= 59) this.ageGroup = 'adult';
        else if (val >= 60) this.ageGroup = 'senior';
        return val;
      },
    },
    ageGroup: {
      type: String,
      enum: ['teenager', 'young_adult', 'adult', 'senior'],
      default: function () {
        const a = this.age || 25;
        if (a >= 10 && a <= 17) return 'teenager';
        if (a >= 18 && a <= 25) return 'young_adult';
        if (a >= 26 && a <= 59) return 'adult';
        return 'senior';
      },
      index: true,
    },

    city: { type: String, trim: true, default: 'Chennai', index: true },
    community: { type: String, trim: true, default: 'Anna Nagar', index: true },
    neighborhood: { type: String, trim: true, default: '' }, // legacy alias for community
    location: { type: locationSchema, default: () => ({}) },

    profilePicture: { type: String, default: '' },

    interests: {
      type: [String],
      default: [],
    },

    // Skills what the member can help with
    skills: {
      type: [String],
      default: [],
    },
    // Backwards-compatible legacy field
    volunteerSkills: {
      type: [String],
      default: [],
    },

    availability: {
      type: availabilitySchema,
      default: () => ({
        weekdays: ['Evening'],
        weekends: ['Morning', 'Afternoon'],
        status: 'Available',
      }),
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Verified', // Community members default to Verified for seamless mutual aid, admins can moderate
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },

    ratingAverage: { type: Number, default: 5.0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    completedRequestsCount: { type: Number, default: 0 },

    isSuspended: { type: Boolean, default: false, index: true },
    suspensionReason: { type: String, default: '' },

    // Firebase Cloud Messaging (FCM) registration tokens
    fcmTokens: [
      {
        token: { type: String, required: true },
        deviceType: { type: String, default: 'web' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Derive age group from age
userSchema.pre('validate', function () {
  if (this.age) {
    if (this.age >= 10 && this.age <= 17) this.ageGroup = 'teenager';
    else if (this.age >= 18 && this.age <= 25) this.ageGroup = 'young_adult';
    else if (this.age >= 26 && this.age <= 59) this.ageGroup = 'adult';
    else if (this.age >= 60) this.ageGroup = 'senior';
  }
  // Keep legacy and new fields in sync
  if (this.mobile && !this.phone) this.phone = this.mobile;
  if (this.phone && !this.mobile) this.mobile = this.phone;
  if (this.community && !this.neighborhood) this.neighborhood = this.community;
  if (this.neighborhood && !this.community) this.community = this.neighborhood;
  if (this.skills && this.skills.length > 0 && (!this.volunteerSkills || this.volunteerSkills.length === 0)) {
    this.volunteerSkills = this.skills;
  }
  if (this.volunteerSkills && this.volunteerSkills.length > 0 && (!this.skills || this.skills.length === 0)) {
    this.skills = this.volunteerSkills;
  }
});

// Redacted public profile for browsing (CRITICAL: No email, No mobile)
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    _id: this._id,
    fullName: this.fullName,
    ageGroup: this.ageGroup,
    city: this.city,
    community: this.community || this.neighborhood,
    profilePicture: this.profilePicture,
    skills: this.skills?.length ? this.skills : this.volunteerSkills,
    interests: this.interests,
    availability: this.availability,
    verificationStatus: this.verificationStatus,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    completedRequestsCount: this.completedRequestsCount,
  };
};

// Full profile for accepted partner (reveals mobile and email after acceptance)
userSchema.methods.toAcceptedPartnerJSON = function () {
  return {
    id: this._id,
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    mobile: this.mobile || this.phone,
    ageGroup: this.ageGroup,
    city: this.city,
    community: this.community || this.neighborhood,
    profilePicture: this.profilePicture,
    skills: this.skills?.length ? this.skills : this.volunteerSkills,
    interests: this.interests,
    availability: this.availability,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    completedRequestsCount: this.completedRequestsCount,
  };
};

module.exports = mongoose.model('User', userSchema);
