/**
 * HelpRequest model — the core entity of NeighborLink.
 * Supports:
 * 1. Help Requests (age-specific categories)
 * 2. Companionship Requests (Company)
 * 3. Emergency Help (Persistent community broadcast)
 *
 * Lifecycle: Pending -> Accepted -> In Progress -> Completed (or Cancelled)
 */
const mongoose = require('mongoose');
const { mapToOfferHelpCategory } = require('../utils/categoryMapper');

const STATUS_VALUES = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];
const URGENCY_VALUES = ['Normal', 'High', 'Urgent'];
const TYPE_VALUES = ['help', 'companionship', 'emergency'];

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const helpRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPE_VALUES, default: 'help', index: true },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    category: { type: String, required: true, trim: true, index: true },
    helpCategory: { type: String, trim: true, index: true },

    date: { type: String, default: '' },
    time: { type: String, default: '' },

    urgency: { type: String, enum: URGENCY_VALUES, default: 'Normal', index: true },
    requesterUrgency: { type: String, default: 'MEDIUM' }, // legacy compatibility

    city: { type: String, trim: true, default: 'Chennai', index: true },
    community: { type: String, trim: true, default: 'Anna Nagar', index: true },

    location: {
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    requesterLocation: {
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    acceptedMemberLocation: {
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // Emergency fields
    isEmergency: { type: Boolean, default: false, index: true },
    emergencyStatus: {
      type: String,
      enum: ['ACTIVE', 'ACCEPTED', 'RESOLVED'],
      default: function () {
        return this.isEmergency || this.type === 'emergency' ? 'ACTIVE' : 'RESOLVED';
      },
      index: true,
    },

    // Priority computation
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW', index: true },
    priorityScore: { type: Number, default: 0 },
    priorityExplanation: { type: [String], default: [] },

    requiredSkill: { type: String, default: '' },

    status: { type: String, enum: STATUS_VALUES, default: 'Pending', index: true },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: () => [{ status: 'Pending', changedAt: new Date(), note: 'Request created' }],
    },

    // Member who accepted this request (no permanent volunteer role)
    acceptedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // legacy alias

    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },

    requesterReviewed: { type: Boolean, default: false },
    helperReviewed: { type: Boolean, default: false },
    volunteerReviewed: { type: Boolean, default: false }, // legacy alias
  },
  { timestamps: true }
);

helpRequestSchema.pre('save', function (next) {
  if (this.type === 'emergency') {
    this.isEmergency = true;
    this.urgency = 'Urgent';
    this.priority = 'HIGH';
    if (this.status === 'Pending') {
      this.emergencyStatus = 'ACTIVE';
    } else if (this.status === 'Accepted' || this.status === 'In Progress') {
      this.emergencyStatus = 'ACCEPTED';
    } else if (this.status === 'Completed' || this.status === 'Cancelled') {
      this.emergencyStatus = 'RESOLVED';
    }
  }

  if (!this.helpCategory || this.isModified('category') || this.isModified('type')) {
    this.helpCategory = mapToOfferHelpCategory(this);
  }

  // Keep aliases synchronized
  if (this.acceptedMember && !this.assignedVolunteer) {
    this.assignedVolunteer = this.acceptedMember;
  }
  if (this.assignedVolunteer && !this.acceptedMember) {
    this.acceptedMember = this.assignedVolunteer;
  }
  if (this.helperReviewed !== this.volunteerReviewed) {
    this.volunteerReviewed = this.helperReviewed || this.volunteerReviewed;
    this.helperReviewed = this.volunteerReviewed;
  }
  next();
});

helpRequestSchema.index({ city: 1, community: 1, status: 1, isEmergency: 1, createdAt: -1 });

helpRequestSchema.statics.STATUS_VALUES = STATUS_VALUES;
helpRequestSchema.statics.URGENCY_VALUES = URGENCY_VALUES;
helpRequestSchema.statics.TYPE_VALUES = TYPE_VALUES;

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
