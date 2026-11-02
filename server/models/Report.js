const mongoose = require('mongoose');

const REPORT_REASONS = [
  'Inappropriate Behaviour',
  'Misuse of Platform',
  'False Request',
  'Safety Concern',
  'Other',
];

const REPORT_STATUSES = ['Open', 'Under Review', 'Resolved', 'Rejected'];
const ADMIN_ACTIONS = ['None', 'Warning', 'Suspend Member', 'Remove Request', 'Close Report'];

const reportSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: REPORT_STATUSES, default: 'Open', index: true },
    adminAction: { type: String, enum: ADMIN_ACTIONS, default: 'None' },
    adminNotes: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.statics.REASONS = REPORT_REASONS;
reportSchema.statics.STATUSES = REPORT_STATUSES;
reportSchema.statics.ACTIONS = ADMIN_ACTIONS;

module.exports = mongoose.model('Report', reportSchema);
