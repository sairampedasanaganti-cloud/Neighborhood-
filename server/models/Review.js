/**
 * Review model — 1-5 star rating + optional text, tied to a specific completed HelpRequest.
 * A compound unique index prevents duplicate reviews for the same request/reviewer pair.
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', required: true, index: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: '' },
    role: { type: String, enum: ['requester_to_volunteer', 'volunteer_to_requester'], required: true },
  },
  { timestamps: true }
);

// One review per (request, reviewer) pair — prevents duplicate reviews
reviewSchema.index({ request: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
