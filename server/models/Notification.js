/**
 * Notification model — in-app notifications with priority support.
 */
const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'EMERGENCY_ALERT',
  'GOOD_MATCH',
  'NEW_MATCHING_REQUEST',
  'REQUEST_ACCEPTED',
  'STATUS_UPDATED',
  'REQUEST_COMPLETED',
  'REQUEST_CANCELLED',
  'FEEDBACK_REQUEST',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'ADMIN_NOTICE',
  'NEW_REVIEW',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, default: '' },
    message: { type: String, required: true },
    priority: { type: String, enum: ['NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL', index: true },
    matchReasons: { type: [String], default: [] },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, priority: -1, createdAt: -1 });
notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
