const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const Report = require('../models/Report');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

const listUsers = asyncHandler(async (req, res) => {
  const { verificationStatus, role } = req.query;
  const filter = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;
  if (role) filter.role = role;

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

const setVerificationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'Verified' | 'Rejected' | 'Pending'
  if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
    throw new ApiError(400, 'Status must be Verified, Rejected, or Pending.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Community member not found.');

  user.verificationStatus = status;
  await user.save();

  await notify({
    user: user._id,
    type: status === 'Verified' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
    title: 'Verification Status Update',
    message: status === 'Verified'
      ? 'Your community profile has been verified. You now have full platform access.'
      : 'Your verification request was updated by administrators.',
  });

  res.json({ success: true, data: user });
});

const suspendUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Community member not found.');

  user.isSuspended = true;
  user.suspensionReason = reason || 'Violation of community safety guidelines';
  await user.save();

  await notify({
    user: user._id,
    type: 'ADMIN_NOTICE',
    title: 'Account Suspended',
    message: `Your account has been suspended: ${user.suspensionReason}`,
    priority: 'HIGH',
  });

  res.json({ success: true, data: user });
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Community member not found.');

  user.isSuspended = false;
  user.suspensionReason = '';
  await user.save();

  await notify({
    user: user._id,
    type: 'ADMIN_NOTICE',
    title: 'Account Reactivated',
    message: 'Your account suspension has been lifted. Welcome back to NeighborLink.',
    priority: 'NORMAL',
  });

  res.json({ success: true, data: user });
});

const allRequests = asyncHandler(async (req, res) => {
  const { status, type, isEmergency } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (isEmergency !== undefined) filter.isEmergency = isEmergency === 'true';

  const requests = await HelpRequest.find(filter)
    .populate('requester', 'fullName email mobile city community')
    .populate('acceptedMember', 'fullName email mobile city community')
    .populate('assignedVolunteer', 'fullName email mobile city community')
    .sort({ createdAt: -1 })
    .limit(300);

  res.json({ success: true, data: requests });
});

const getEmergencies = asyncHandler(async (req, res) => {
  const emergencies = await HelpRequest.find({ isEmergency: true })
    .populate('requester', 'fullName mobile email city community')
    .populate('acceptedMember', 'fullName mobile email city community')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: emergencies });
});

const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('reviewer', 'fullName email')
    .populate('reviewee', 'fullName email')
    .populate('request', 'title category')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ success: true, data: reviews });
});

/**
 * Platform metrics: Total Members, Active Requests, Accepted Requests, Active Emergencies, Open Reports, Completed Activities.
 */
const stats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    verifiedUsers,
    activeRequests,
    acceptedRequests,
    activeEmergencies,
    openReports,
    completedActivities,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ verificationStatus: 'Verified' }),
    HelpRequest.countDocuments({ status: 'Pending' }),
    HelpRequest.countDocuments({ status: { $in: ['Accepted', 'In Progress'] } }),
    HelpRequest.countDocuments({ isEmergency: true, emergencyStatus: 'ACTIVE' }),
    Report.countDocuments({ status: { $in: ['Open', 'Under Review'] } }),
    HelpRequest.countDocuments({ status: 'Completed' }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      verifiedUsers,
      activeRequests,
      acceptedRequests,
      activeEmergencies,
      openReports,
      completedActivities,
    },
  });
});

module.exports = {
  listUsers,
  setVerificationStatus,
  suspendUser,
  reactivateUser,
  allRequests,
  getEmergencies,
  getAllReviews,
  stats,
};
