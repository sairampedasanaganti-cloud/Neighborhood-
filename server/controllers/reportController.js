const Report = require('../models/Report');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

const createReport = asyncHandler(async (req, res) => {
  const { requestId, reportedUser, reason, description } = req.body;

  if (!reason || !description) {
    throw new ApiError(400, 'Reason and description are required.');
  }

  const report = await Report.create({
    requestId: requestId || null,
    reporter: req.user._id,
    reportedUser: reportedUser || null,
    reason,
    description,
    status: 'Open',
  });

  // Notify system admin of new report
  const adminUser = await User.findOne({ role: 'admin' });
  if (adminUser) {
    await notify({
      user: adminUser._id,
      type: 'ADMIN_NOTICE',
      title: '⚠️ New Issue Report Submitted',
      message: `Report filed by ${req.user.fullName} for reason: ${reason}.`,
      priority: 'HIGH',
    });
  }

  res.status(201).json({ success: true, data: report });
});

const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const reports = await Report.find(filter)
    .populate('reporter', 'fullName email mobile community')
    .populate('reportedUser', 'fullName email mobile community isSuspended')
    .populate('requestId', 'title category status')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reports });
});

const updateReport = asyncHandler(async (req, res) => {
  const { status, adminAction, adminNotes } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found.');

  if (status) report.status = status;
  if (adminAction) report.adminAction = adminAction;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  if (status === 'Resolved' || status === 'Rejected') {
    report.resolvedAt = new Date();
  }

  // Execute admin action
  if (adminAction === 'Suspend Member' && report.reportedUser) {
    await User.findByIdAndUpdate(report.reportedUser, {
      isSuspended: true,
      suspensionReason: `Suspended due to report #${report._id}: ${report.reason}`,
    });
  } else if (adminAction === 'Remove Request' && report.requestId) {
    await HelpRequest.findByIdAndUpdate(report.requestId, {
      status: 'Cancelled',
      cancelReason: 'Removed by administrator due to community safety report',
    });
  }

  await report.save();

  // Notify reporter of report resolution
  if (report.status === 'Resolved') {
    await notify({
      user: report.reporter,
      type: 'ADMIN_NOTICE',
      title: 'Report Update',
      message: `Your report regarding "${report.reason}" has been reviewed and resolved by administration.`,
      priority: 'NORMAL',
    });
  }

  res.json({ success: true, data: report });
});

module.exports = { createReport, getReports, updateReport };
