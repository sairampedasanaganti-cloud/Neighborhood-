const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { calculatePriority } = require('../services/priorityEngine');
const { rankVolunteers, calculateMatchScore } = require('../services/matchingEngine');
const { notify } = require('../services/notificationService');
const { mapToOfferHelpCategory } = require('../utils/categoryMapper');
const { sendRequestNotificationPush } = require('../services/fcmService');
const { getCoordinatesForCommunity } = require('../utils/coordinates');

const VALID_TRANSITIONS = {
  Accepted: ['In Progress', 'Completed', 'Cancelled'],
  'On the Way': ['In Progress', 'Completed', 'Cancelled'], // legacy compatibility
  'In Progress': ['Completed', 'Cancelled'],
};

/**
 * Sanitize request to prevent contact information and exact location leakage before acceptance.
 * In accordance with Requirement #18 and Location Privacy Rules:
 * - Mobile number, email, and exact location remain strictly PRIVATE until acceptance.
 * - AFTER ACCEPTANCE: ONLY the Requester and Accepted Member can access each other's location and contact details.
 * - Other community members (e.g. User C) NEVER receive another member's exact location or contact info.
 */
function sanitizeRequestForViewer(requestObj, viewerId) {
  const viewerStr = String(viewerId);
  const requesterId = String(requestObj.requester?._id || requestObj.requester);
  const acceptedMemberId = requestObj.acceptedMember?._id || requestObj.assignedVolunteer?._id || requestObj.acceptedMember;
  const acceptedMemberStr = acceptedMemberId ? String(acceptedMemberId) : null;

  const isOwner = requesterId === viewerStr;
  const isAcceptedMember = acceptedMemberStr && acceptedMemberStr === viewerStr;
  const isParticipant = isOwner || isAcceptedMember;
  const isContactVisible = ['Accepted', 'In Progress', 'Completed'].includes(requestObj.status);
  const isLocationActive = ['Accepted', 'In Progress'].includes(requestObj.status);

  // If user is neither party, or request is still pending, strip contact details
  if (!isContactVisible || !isParticipant) {
    if (requestObj.requester && typeof requestObj.requester === 'object') {
      delete requestObj.requester.email;
      delete requestObj.requester.mobile;
      delete requestObj.requester.phone;
    }
    if (requestObj.acceptedMember && typeof requestObj.acceptedMember === 'object') {
      delete requestObj.acceptedMember.email;
      delete requestObj.acceptedMember.mobile;
      delete requestObj.acceptedMember.phone;
    }
    if (requestObj.assignedVolunteer && typeof requestObj.assignedVolunteer === 'object') {
      delete requestObj.assignedVolunteer.email;
      delete requestObj.assignedVolunteer.mobile;
      delete requestObj.assignedVolunteer.phone;
    }
  }

  // Location Access Control:
  // ONLY the Requester and Accepted Member can see location information,
  // and ONLY when the request is Accepted or In Progress.
  if (isParticipant && isLocationActive) {
    requestObj.locationAccessGranted = true;

    const reqComm = requestObj.requester?.community || requestObj.community;
    const reqCity = requestObj.requester?.city || requestObj.city;
    const helpComm = requestObj.acceptedMember?.community || requestObj.community;
    const helpCity = requestObj.acceptedMember?.city || requestObj.city;

    const defaultReqCoords = getCoordinatesForCommunity(reqComm, reqCity);
    const defaultHelpCoords = getCoordinatesForCommunity(helpComm, helpCity);

    let reqLat = requestObj.requesterLocation?.lat != null ? Number(requestObj.requesterLocation.lat) : (requestObj.location?.lat != null ? Number(requestObj.location.lat) : defaultReqCoords.lat);
    let reqLng = requestObj.requesterLocation?.lng != null ? Number(requestObj.requesterLocation.lng) : (requestObj.location?.lng != null ? Number(requestObj.location.lng) : defaultReqCoords.lng);

    let helpLat = requestObj.acceptedMemberLocation?.lat != null ? Number(requestObj.acceptedMemberLocation.lat) : (requestObj.acceptedMember?.location?.lat != null ? Number(requestObj.acceptedMember.location.lat) : defaultHelpCoords.lat);
    let helpLng = requestObj.acceptedMemberLocation?.lng != null ? Number(requestObj.acceptedMemberLocation.lng) : (requestObj.acceptedMember?.location?.lng != null ? Number(requestObj.acceptedMember.location.lng) : defaultHelpCoords.lng);

    if (Math.abs(helpLat - reqLat) < 0.0005 && Math.abs(helpLng - reqLng) < 0.0005) {
      helpLat += 0.0035;
      helpLng += 0.0045;
    }

    requestObj.requesterLocation = {
      name: requestObj.requester?.fullName || 'Requester',
      role: 'Requester',
      address: requestObj.requesterLocation?.address || requestObj.location?.address || `${reqComm}, ${reqCity}`,
      lat: reqLat,
      lng: reqLng,
      community: reqComm,
      city: reqCity,
    };
    requestObj.acceptedMemberLocation = {
      name: requestObj.acceptedMember?.fullName || 'Accepted Member',
      role: 'Accepted Member',
      address: requestObj.acceptedMemberLocation?.address || requestObj.acceptedMember?.location?.address || `${helpComm}, ${helpCity}`,
      lat: helpLat,
      lng: helpLng,
      community: helpComm,
      city: helpCity,
    };
  } else {
    requestObj.locationAccessGranted = false;
    delete requestObj.requesterLocation;
    delete requestObj.acceptedMemberLocation;

    // Sanitize general request.location so exact address or coordinates are never leaked to non-participants
    if (requestObj.location) {
      requestObj.location = {
        address: `${requestObj.community || ''}, ${requestObj.city || ''}`.trim(),
        lat: null,
        lng: null,
      };
    }
    if (requestObj.requester && typeof requestObj.requester === 'object') {
      delete requestObj.requester.location;
    }
    if (requestObj.acceptedMember && typeof requestObj.acceptedMember === 'object') {
      delete requestObj.acceptedMember.location;
    }
    if (requestObj.assignedVolunteer && typeof requestObj.assignedVolunteer === 'object') {
      delete requestObj.assignedVolunteer.location;
    }
  }

  return requestObj;
}

/**
 * Create a new Help, Companionship, or Emergency request.
 */
const createRequest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    type = 'help',
    date,
    time,
    urgency = 'Normal',
    city,
    community,
    location,
    requiredSkill,
  } = req.body;

  const userCity = city || req.user.city || 'Chennai';
  const userCommunity = community || req.user.community || req.user.neighborhood || 'Anna Nagar';

  const isEmergency = type === 'emergency' || urgency === 'Urgent';

  let computedScore = 30;
  let computedPriority = 'LOW';
  let explanation = ['Standard community request'];

  if (isEmergency) {
    computedScore = 95;
    computedPriority = 'HIGH';
    explanation = ['Emergency help request flagged for immediate neighborhood response'];
  } else {
    const priorityCalc = calculatePriority({
      category: category || 'Other Community Help',
      requesterUrgency: urgency === 'Urgent' ? 'HIGH' : urgency === 'High' ? 'MEDIUM' : 'LOW',
      description: `${title}. ${description || ''}`,
    });
    computedScore = priorityCalc.score;
    computedPriority = priorityCalc.priority;
    explanation = priorityCalc.explanation;
  }

  const defaultReqCoords = getCoordinatesForCommunity(userCommunity, userCity);
  const resolvedLocation = {
    address: location?.address || req.user.location?.address || `${userCommunity}, ${userCity}`,
    lat: location?.lat != null ? Number(location.lat) : (req.user.location?.lat != null ? Number(req.user.location.lat) : defaultReqCoords.lat),
    lng: location?.lng != null ? Number(location.lng) : (req.user.location?.lng != null ? Number(req.user.location.lng) : defaultReqCoords.lng),
  };

  const request = await HelpRequest.create({
    requester: req.user._id,
    type: isEmergency ? 'emergency' : type,
    title,
    description,
    category,
    helpCategory: req.body.helpCategory || mapToOfferHelpCategory({ title, description, category, type: isEmergency ? 'emergency' : type }),
    date: date || new Date().toISOString().split('T')[0],
    time: time || '',
    urgency: isEmergency ? 'Urgent' : urgency,
    requesterUrgency: isEmergency ? 'HIGH' : urgency === 'High' ? 'MEDIUM' : 'LOW',
    city: userCity,
    community: userCommunity,
    location: resolvedLocation,
    requesterLocation: resolvedLocation,
    requiredSkill: requiredSkill || '',
    isEmergency,
    emergencyStatus: isEmergency ? 'ACTIVE' : 'RESOLVED',
    priority: computedPriority,
    priorityScore: computedScore,
    priorityExplanation: explanation,
    status: 'Pending',
    statusHistory: [{ status: 'Pending', changedAt: new Date(), note: 'Request posted' }],
  });

  // Find candidate members in the same community / city
  const candidates = await User.find({
    _id: { $ne: req.user._id },
    city: userCity,
    isSuspended: false,
  }).limit(150);

  if (isEmergency) {
    // Broadcast emergency notification to EVERY eligible community member
    await Promise.all(
      candidates.map((member) =>
        notify({
          user: member._id,
          type: 'EMERGENCY_ALERT',
          title: '🚨 Urgent Emergency in Your Community',
          message: `URGENT: ${req.user.fullName} needs emergency help in ${userCommunity}: "${title}"`,
          priority: 'URGENT',
          relatedRequest: request._id,
        })
      )
    );

    // FCM Web Push: send urgent notification to all eligible members in the community (requester excluded)
    sendRequestNotificationPush({
      request,
      recipientIds: candidates.map((m) => m._id),
      isEmergency: true,
      title: `🚨 Urgent Emergency in ${userCommunity}`,
      body: `Emergency help needed: "${title}". Click to respond immediately.`,
    }).catch((pushErr) => console.warn('[FCM] Emergency push dispatch notice:', pushErr.message));
  } else {
    // Calculate smart matches and notify top matching community members
    const ranked = rankVolunteers(candidates, request).filter((r) => r.score >= 40).slice(0, 10);
    await Promise.all(
      ranked.map((r) =>
        notify({
          user: r.volunteer._id,
          type: 'GOOD_MATCH',
          title: '🎯 Good Match for You!',
          message: `${req.user.fullName} is looking for ${category}: "${title}". You match based on your skills, availability, and community.`,
          priority: computedPriority === 'HIGH' ? 'HIGH' : 'NORMAL',
          matchReasons: r.explanation || [],
          relatedRequest: request._id,
        })
      )
    );

    // FCM Web Push: send notification to eligible matching members (requester excluded)
    sendRequestNotificationPush({
      request,
      recipientIds: ranked.map((r) => r.volunteer._id),
      isEmergency: false,
      title: `🤝 New ${request.helpCategory || category || 'Help'} Request in ${userCommunity}`,
      body: `A neighbor in ${userCommunity} requested assistance: "${title}".`,
    }).catch((pushErr) => console.warn('[FCM] Match push dispatch notice:', pushErr.message));
  }

  res.status(201).json({ success: true, data: request });
});

/**
 * Browse open (Pending) requests in the community with filters.
 */
const browseRequests = asyncHandler(async (req, res) => {
  const { type, category, helpCategory, urgency, city, community, sort = 'newest' } = req.query;

  const filter = { status: 'Pending' };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (urgency) filter.urgency = urgency;

  // By default, match user's city
  if (city) filter.city = city;
  else if (req.user.city) filter.city = req.user.city;

  if (community) filter.community = community;

  let sortSpec = { isEmergency: -1, createdAt: -1 };
  if (sort === 'oldest') sortSpec = { isEmergency: -1, createdAt: 1 };
  if (sort === 'urgency') sortSpec = { priorityScore: -1, createdAt: -1 };

  const requests = await HelpRequest.find(filter)
    .populate('requester', 'fullName ageGroup city community neighborhood ratingAverage verificationStatus')
    .sort(sortSpec)
    .limit(100);

  // Attach match score and helpCategory for the requesting user
  let data = requests.map((r) => {
    const match = calculateMatchScore(req.user, r);
    const obj = r.toObject();
    obj.matchScore = match.score;
    obj.matchReasons = match.explanation;
    obj.eligible = match.eligible !== false;
    obj.helpCategory = obj.helpCategory || mapToOfferHelpCategory(obj);
    return sanitizeRequestForViewer(obj, req.user._id);
  });

  if (helpCategory) {
    data = data.filter((r) => r.helpCategory === helpCategory);
  }

  res.json({ success: true, data });
});

/**
 * Get active emergency requests in user's community.
 */
const getActiveEmergencies = asyncHandler(async (req, res) => {
  const userCity = req.user.city || 'Chennai';
  const userComm = req.user.community || req.user.neighborhood || '';

  const query = {
    isEmergency: true,
    emergencyStatus: 'ACTIVE',
    status: 'Pending',
    city: userCity,
  };

  if (userComm) {
    query.community = userComm;
  }

  const emergencies = await HelpRequest.find(query)
    .populate('requester', 'fullName ageGroup city community neighborhood')
    .sort({ createdAt: -1 });

  const sanitized = emergencies.map((e) => sanitizeRequestForViewer(e.toObject(), req.user._id));
  res.json({ success: true, data: sanitized });
});

/**
 * Get single request details by ID (with privacy enforcement).
 */
const getRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate('requester', 'fullName email mobile phone ageGroup city community neighborhood ratingAverage ratingCount skills interests availability location')
    .populate('acceptedMember', 'fullName email mobile phone ageGroup city community neighborhood ratingAverage ratingCount skills interests availability location')
    .populate('assignedVolunteer', 'fullName email mobile phone ageGroup city community neighborhood ratingAverage ratingCount skills interests availability location');

  if (!request) throw new ApiError(404, 'Request not found.');

  const obj = request.toObject();
  const sanitized = sanitizeRequestForViewer(obj, req.user._id);

  // Calculate viewer's match details
  const match = calculateMatchScore(req.user, request);
  sanitized.matchScore = match.score;
  sanitized.matchReasons = match.explanation;

  res.json({ success: true, data: sanitized });
});

/**
 * Accept a request.
 * Race-safe atomic update prevents multiple members from accepting.
 */
const acceptRequest = asyncHandler(async (req, res) => {
  const now = new Date();

  const updated = await HelpRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'Pending' },
    {
      $set: {
        status: 'Accepted',
        acceptedMember: req.user._id,
        assignedVolunteer: req.user._id,
        acceptedAt: now,
        emergencyStatus: 'ACCEPTED',
      },
      $push: {
        statusHistory: {
          status: 'Accepted',
          changedAt: now,
          note: `Accepted by community member ${req.user.fullName}`,
        },
      },
    },
    { new: true }
  )
    .populate('requester', 'fullName email mobile phone ageGroup city community location')
    .populate('acceptedMember', 'fullName email mobile phone ageGroup city community location');

  if (!updated) {
    const existing = await HelpRequest.findById(req.params.id);
    if (!existing) throw new ApiError(404, 'Request not found.');
    throw new ApiError(409, 'This request has already been accepted by another community member.');
  }

  if (String(updated.requester._id) === String(req.user._id)) {
    // Rollback if someone attempts to accept their own request
    updated.status = 'Pending';
    updated.acceptedMember = null;
    updated.assignedVolunteer = null;
    updated.acceptedAt = null;
    if (updated.isEmergency) updated.emergencyStatus = 'ACTIVE';
    await updated.save();
    throw new ApiError(400, 'You cannot accept your own request.');
  }

  // Set mutual location data with accurate coordinates
  const helpCommunity = req.user.community || updated.community;
  const helpCity = req.user.city || updated.city;
  const reqCommunity = updated.community || updated.city;
  const reqCity = updated.city || 'Chennai';

  const defaultHelpCoords = getCoordinatesForCommunity(helpCommunity, helpCity);
  const defaultReqCoords = getCoordinatesForCommunity(reqCommunity, reqCity);

  let helperLat = req.user.location?.lat != null ? Number(req.user.location.lat) : defaultHelpCoords.lat;
  let helperLng = req.user.location?.lng != null ? Number(req.user.location.lng) : defaultHelpCoords.lng;

  let reqLat = updated.requesterLocation?.lat != null ? Number(updated.requesterLocation.lat) : (updated.location?.lat != null ? Number(updated.location.lat) : defaultReqCoords.lat);
  let reqLng = updated.requesterLocation?.lng != null ? Number(updated.requesterLocation.lng) : (updated.location?.lng != null ? Number(updated.location.lng) : defaultReqCoords.lng);

  // If both coordinates are near identical (same community default pin), offset slightly (~400m)
  if (Math.abs(helperLat - reqLat) < 0.0005 && Math.abs(helperLng - reqLng) < 0.0005) {
    helperLat += 0.0035;
    helperLng += 0.0045;
  }

  const reqUserLoc = {
    name: req.user.fullName || 'Accepted Member',
    role: 'Accepted Member',
    address: req.user.location?.address || `${helpCommunity}, ${helpCity}`,
    lat: helperLat,
    lng: helperLng,
    community: helpCommunity,
    city: helpCity,
  };

  const reqOwnerLoc = {
    name: updated.requester?.fullName || 'Requester',
    role: 'Requester',
    address: updated.requesterLocation?.address || updated.location?.address || `${reqCommunity}, ${reqCity}`,
    lat: reqLat,
    lng: reqLng,
    community: reqCommunity,
    city: reqCity,
  };

  updated.acceptedMemberLocation = reqUserLoc;
  updated.requesterLocation = reqOwnerLoc;
  await updated.save();

  // Notify requester that their request was accepted
  await notify({
    user: updated.requester._id,
    type: 'REQUEST_ACCEPTED',
    title: '🤝 Request Accepted!',
    message: `${req.user.fullName} accepted your request: "${updated.title}". Contact and location details are now available.`,
    priority: 'HIGH',
    relatedRequest: updated._id,
  });

  // Notify accepted member
  await notify({
    user: req.user._id,
    type: 'STATUS_UPDATED',
    title: '🤝 Task Confirmed',
    message: `You are now connected with ${updated.requester.fullName} for "${updated.title}".`,
    priority: 'NORMAL',
    relatedRequest: updated._id,
  });

  const sanitized = sanitizeRequestForViewer(updated.toObject(), req.user._id);
  res.json({ success: true, data: sanitized });
});

/**
 * Dedicated location retrieval endpoint: GET /api/requests/:id/location
 * Backend security enforces:
 * 1. User must be authenticated.
 * 2. Request must be in 'Accepted' or 'In Progress' state.
 * 3. User MUST be either the Requester or the Accepted Member.
 * Any other user (User C, random community member, unauthenticated caller) receives 403 Forbidden.
 */
const getRequestLocation = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate('requester', 'fullName ageGroup city community neighborhood location')
    .populate('acceptedMember', 'fullName ageGroup city community neighborhood location');

  if (!request) {
    throw new ApiError(404, 'Request not found.');
  }

  const isAcceptedOrBeyond = ['Accepted', 'In Progress'].includes(request.status);
  if (!isAcceptedOrBeyond) {
    throw new ApiError(403, 'Location details are only accessible while the request is in Accepted or In Progress status.');
  }

  const viewerStr = String(req.user._id);
  const requesterId = String(request.requester?._id || request.requester);
  const acceptedMemberId = request.acceptedMember ? String(request.acceptedMember._id || request.acceptedMember) : null;

  const isRequester = requesterId === viewerStr;
  const isAcceptedMember = acceptedMemberId && acceptedMemberId === viewerStr;

  if (!isRequester && !isAcceptedMember) {
    throw new ApiError(403, 'You are not authorized to view location details for this request.');
  }

  const reqComm = request.requester?.community || request.community;
  const reqCity = request.requester?.city || request.city;
  const helpComm = request.acceptedMember?.community || request.community;
  const helpCity = request.acceptedMember?.city || request.city;

  const defaultReqCoords = getCoordinatesForCommunity(reqComm, reqCity);
  const defaultHelpCoords = getCoordinatesForCommunity(helpComm, helpCity);

  let reqLat = request.requesterLocation?.lat != null ? Number(request.requesterLocation.lat) : (request.location?.lat != null ? Number(request.location.lat) : defaultReqCoords.lat);
  let reqLng = request.requesterLocation?.lng != null ? Number(request.requesterLocation.lng) : (request.location?.lng != null ? Number(request.location.lng) : defaultReqCoords.lng);

  let helpLat = request.acceptedMemberLocation?.lat != null ? Number(request.acceptedMemberLocation.lat) : (request.acceptedMember?.location?.lat != null ? Number(request.acceptedMember.location.lat) : defaultHelpCoords.lat);
  let helpLng = request.acceptedMemberLocation?.lng != null ? Number(request.acceptedMemberLocation.lng) : (request.acceptedMember?.location?.lng != null ? Number(request.acceptedMember.location.lng) : defaultHelpCoords.lng);

  if (Math.abs(helpLat - reqLat) < 0.0005 && Math.abs(helpLng - reqLng) < 0.0005) {
    helpLat += 0.0035;
    helpLng += 0.0045;
  }

  const requesterLoc = {
    name: request.requester?.fullName || 'Requester',
    role: 'Requester',
    community: reqComm,
    city: reqCity,
    address: request.requesterLocation?.address || request.location?.address || `${reqComm}, ${reqCity}`,
    lat: reqLat,
    lng: reqLng,
  };

  const acceptedMemberLoc = {
    name: request.acceptedMember?.fullName || 'Accepted Member',
    role: 'Accepted Member',
    community: helpComm,
    city: helpCity,
    address: request.acceptedMemberLocation?.address || request.acceptedMember?.location?.address || `${helpComm}, ${helpCity}`,
    lat: helpLat,
    lng: helpLng,
  };

  res.json({
    success: true,
    data: {
      requestId: request._id,
      status: request.status,
      requesterLocation: requesterLoc,
      acceptedMemberLocation: acceptedMemberLoc,
    },
  });
});

/**
 * Update request status along the lifecycle:
 * Accepted -> In Progress -> Completed (or Cancelled)
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const request = await HelpRequest.findById(req.params.id)
    .populate('requester', 'fullName')
    .populate('acceptedMember', 'fullName');

  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.requester?._id || request.requester) === String(req.user._id);
  const isHelper = request.acceptedMember && String(request.acceptedMember._id || request.acceptedMember) === String(req.user._id);

  if (!isOwner && !isHelper && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not authorized to update this request status.');
  }

  const allowedNext = VALID_TRANSITIONS[request.status] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Invalid status transition from "${request.status}" to "${status}".`);
  }

  request.status = status;
  request.statusHistory.push({
    status,
    changedAt: new Date(),
    note: note || `Status updated to ${status} by ${req.user.fullName}`,
  });

  if (status === 'Completed') {
    request.completedAt = new Date();
    if (request.isEmergency) request.emergencyStatus = 'RESOLVED';

    // Increment completed requests count for helping member
    if (request.acceptedMember) {
      await User.findByIdAndUpdate(request.acceptedMember, { $inc: { completedRequestsCount: 1 } });
    }

    // Send completion and feedback notifications to both parties
    const otherUserId = isOwner ? request.acceptedMember?._id : request.requester?._id;
    if (otherUserId) {
      await notify({
        user: otherUserId,
        type: 'REQUEST_COMPLETED',
        title: '🎉 Activity Completed!',
        message: `"${request.title}" was marked Completed. Please leave your rating and feedback.`,
        relatedRequest: request._id,
      });
    }
  }

  if (status === 'Cancelled') {
    request.cancelledAt = new Date();
    request.cancelReason = note || '';
    if (request.isEmergency) request.emergencyStatus = 'RESOLVED';
  }

  await request.save();
  res.json({ success: true, data: request });
});

/**
 * Cancel a request before completion.
 */
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.requester) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the requester or an administrator can cancel this request.');
  }

  if (['Completed', 'Cancelled'].includes(request.status)) {
    throw new ApiError(400, `Request is already ${request.status.toLowerCase()}.`);
  }

  request.status = 'Cancelled';
  request.cancelledAt = new Date();
  request.cancelReason = req.body.reason || 'Cancelled by requester';
  if (request.isEmergency) request.emergencyStatus = 'RESOLVED';
  request.statusHistory.push({ status: 'Cancelled', changedAt: new Date(), note: request.cancelReason });
  await request.save();

  if (request.acceptedMember) {
    await notify({
      user: request.acceptedMember,
      type: 'REQUEST_CANCELLED',
      title: 'Request Cancelled',
      message: `The request "${request.title}" was cancelled by the requester.`,
      relatedRequest: request._id,
    });
  }

  res.json({ success: true, data: request });
});

/**
 * Unified Activity History for current user.
 * Separates into Active, Completed, Cancelled.
 */
const myActivities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const requests = await HelpRequest.find({
    $or: [{ requester: userId }, { acceptedMember: userId }, { assignedVolunteer: userId }],
  })
    .populate('requester', 'fullName ageGroup city community ratingAverage')
    .populate('acceptedMember', 'fullName ageGroup city community ratingAverage')
    .sort({ createdAt: -1 });

  const active = [];
  const completed = [];
  const cancelled = [];

  requests.forEach((r) => {
    const sanitized = sanitizeRequestForViewer(r.toObject(), userId);
    if (r.status === 'Completed') completed.push(sanitized);
    else if (r.status === 'Cancelled') cancelled.push(sanitized);
    else active.push(sanitized);
  });

  res.json({
    success: true,
    data: {
      active,
      completed,
      cancelled,
      total: requests.length,
    },
  });
});

module.exports = {
  createRequest,
  browseRequests,
  getActiveEmergencies,
  getRequestById,
  getRequestLocation,
  acceptRequest,
  updateStatus,
  cancelRequest,
  myActivities,
};
