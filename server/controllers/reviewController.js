const HelpRequest = require('../models/HelpRequest');
const Review = require('../models/Review');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

/** Recalculate a user's aggregate rating after a new review is added. */
async function recalcRating(userId) {
  const stats = await Review.aggregate([
    { $match: { reviewee: userId } },
    { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await User.findByIdAndUpdate(userId, { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count });
}

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  if (request.status !== 'Completed') throw new ApiError(400, 'Reviews are only allowed after a request is completed.');

  const isRequester = String(request.requester) === String(req.user._id);
  const isVolunteer = request.assignedVolunteer && String(request.assignedVolunteer) === String(req.user._id);
  if (!isRequester && !isVolunteer) throw new ApiError(403, 'You are not part of this request.');

  const reviewee = isRequester ? request.assignedVolunteer : request.requester;
  const role = isRequester ? 'requester_to_volunteer' : 'volunteer_to_requester';

  const alreadyFlagged = isRequester ? request.requesterReviewed : request.volunteerReviewed;
  if (alreadyFlagged) throw new ApiError(409, 'You have already reviewed this request.');

  let review;
  try {
    review = await Review.create({
      request: request._id, reviewer: req.user._id, reviewee, rating, comment, role,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'You have already reviewed this request.');
    throw err;
  }

  if (isRequester) request.requesterReviewed = true;
  else request.volunteerReviewed = true;
  await request.save();

  await recalcRating(reviewee);
  await notify({
    user: reviewee,
    type: 'NEW_REVIEW',
    message: `You received a new ${rating}-star review for "${request.title}".`,
    relatedRequest: request._id,
  });

  res.status(201).json({ success: true, data: review });
});

const getReviewsForUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'fullName')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

module.exports = { createReview, getReviewsForUser };
