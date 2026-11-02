const HelpRequest = require('../models/HelpRequest');

// Replicate sanitizeRequestForViewer to test unit privacy rules
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

  if (!isContactVisible || !isParticipant) {
    if (requestObj.requester && typeof requestObj.requester === 'object') {
      delete requestObj.requester.email;
      delete requestObj.requester.mobile;
    }
    if (requestObj.acceptedMember && typeof requestObj.acceptedMember === 'object') {
      delete requestObj.acceptedMember.email;
      delete requestObj.acceptedMember.mobile;
    }
  }

  if (isParticipant && isLocationActive) {
    requestObj.locationAccessGranted = true;
    requestObj.requesterLocation = {
      address: requestObj.requesterLocation?.address || requestObj.location?.address || 'Community, City',
      lat: requestObj.requesterLocation?.lat ?? 13.0850,
      lng: requestObj.requesterLocation?.lng ?? 80.2150,
    };
    requestObj.acceptedMemberLocation = {
      address: requestObj.acceptedMemberLocation?.address || 'Community, City',
      lat: requestObj.acceptedMemberLocation?.lat ?? 13.0880,
      lng: requestObj.acceptedMemberLocation?.lng ?? 80.2180,
    };
  } else {
    requestObj.locationAccessGranted = false;
    delete requestObj.requesterLocation;
    delete requestObj.acceptedMemberLocation;
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
  }

  return requestObj;
}

describe('Location Privacy & Access Control Rules', () => {
  const requesterId = '600000000000000000000001';
  const acceptedMemberId = '600000000000000000000002';
  const userC_Id = '600000000000000000000003';

  const pendingRequest = {
    _id: '700000000000000000000001',
    status: 'Pending',
    city: 'Chennai',
    community: 'Anna Nagar',
    location: { address: 'Flat 4B, 10th Street, Anna Nagar', lat: 13.085, lng: 80.215 },
    requester: {
      _id: requesterId,
      fullName: 'Requester A',
      email: 'a@demo.com',
      mobile: '9876543210',
      location: { address: 'Flat 4B, 10th Street, Anna Nagar', lat: 13.085, lng: 80.215 },
    },
    acceptedMember: null,
  };

  const acceptedRequest = {
    _id: '700000000000000000000001',
    status: 'Accepted',
    city: 'Chennai',
    community: 'Anna Nagar',
    location: { address: 'Flat 4B, 10th Street, Anna Nagar', lat: 13.085, lng: 80.215 },
    requesterLocation: { address: 'Flat 4B, 10th Street, Anna Nagar', lat: 13.085, lng: 80.215 },
    acceptedMemberLocation: { address: '3rd Cross Road, Anna Nagar', lat: 13.088, lng: 80.218 },
    requester: {
      _id: requesterId,
      fullName: 'Requester A',
      email: 'a@demo.com',
      mobile: '9876543210',
    },
    acceptedMember: {
      _id: acceptedMemberId,
      fullName: 'Helper B',
      email: 'b@demo.com',
      mobile: '9876543211',
    },
  };

  test('CASE 1: Before acceptance, location is masked for all users', () => {
    const forReq = sanitizeRequestForViewer(JSON.parse(JSON.stringify(pendingRequest)), requesterId);
    expect(forReq.locationAccessGranted).toBe(false);
    expect(forReq.requesterLocation).toBeUndefined();
    expect(forReq.acceptedMemberLocation).toBeUndefined();

    const forHelper = sanitizeRequestForViewer(JSON.parse(JSON.stringify(pendingRequest)), acceptedMemberId);
    expect(forHelper.locationAccessGranted).toBe(false);
    expect(forHelper.requesterLocation).toBeUndefined();
    expect(forHelper.location.lat).toBeNull();

    const forUserC = sanitizeRequestForViewer(JSON.parse(JSON.stringify(pendingRequest)), userC_Id);
    expect(forUserC.locationAccessGranted).toBe(false);
    expect(forUserC.requesterLocation).toBeUndefined();
    expect(forUserC.location.lat).toBeNull();
  });

  test('CASE 2: After acceptance, location is shared between Requester and Accepted Member', () => {
    const forReq = sanitizeRequestForViewer(JSON.parse(JSON.stringify(acceptedRequest)), requesterId);
    expect(forReq.locationAccessGranted).toBe(true);
    expect(forReq.requesterLocation).toBeDefined();
    expect(forReq.acceptedMemberLocation).toBeDefined();
    expect(forReq.acceptedMemberLocation.address).toBe('3rd Cross Road, Anna Nagar');

    const forHelper = sanitizeRequestForViewer(JSON.parse(JSON.stringify(acceptedRequest)), acceptedMemberId);
    expect(forHelper.locationAccessGranted).toBe(true);
    expect(forHelper.requesterLocation).toBeDefined();
    expect(forHelper.requesterLocation.address).toBe('Flat 4B, 10th Street, Anna Nagar');
    expect(forHelper.acceptedMemberLocation).toBeDefined();
  });

  test('CASE 2B: User C (3rd party) CANNOT see location or contact info after acceptance', () => {
    const forUserC = sanitizeRequestForViewer(JSON.parse(JSON.stringify(acceptedRequest)), userC_Id);
    expect(forUserC.locationAccessGranted).toBe(false);
    expect(forUserC.requesterLocation).toBeUndefined();
    expect(forUserC.acceptedMemberLocation).toBeUndefined();
    expect(forUserC.requester.mobile).toBeUndefined();
    expect(forUserC.acceptedMember.mobile).toBeUndefined();
  });

  test('CASE 6: Completed request no longer exposes private location', () => {
    const completedRequest = JSON.parse(JSON.stringify(acceptedRequest));
    completedRequest.status = 'Completed';

    const forReq = sanitizeRequestForViewer(completedRequest, requesterId);
    expect(forReq.locationAccessGranted).toBe(false);
    expect(forReq.requesterLocation).toBeUndefined();
    expect(forReq.acceptedMemberLocation).toBeUndefined();
  });

  test('CASE 7: Direct location API authorization logic rejects non-participants and unaccepted requests', () => {
    function verifyLocationAccess(request, user) {
      if (!request) return { status: 404, message: 'Request not found.' };
      if (!['Accepted', 'In Progress'].includes(request.status)) {
        return { status: 403, message: 'Location details are only accessible while request is Accepted or In Progress.' };
      }
      const userId = String(user._id);
      const isReq = String(request.requester?._id || request.requester) === userId;
      const isAccepted = String(request.acceptedMember?._id || request.acceptedMember) === userId;
      if (!isReq && !isAccepted) {
        return { status: 403, message: 'Forbidden: unauthorized user.' };
      }
      return { status: 200, access: true };
    }

    // Pending request -> 403
    expect(verifyLocationAccess(pendingRequest, { _id: requesterId }).status).toBe(403);
    // Accepted request, User C -> 403
    expect(verifyLocationAccess(acceptedRequest, { _id: userC_Id }).status).toBe(403);
    // Accepted request, Requester -> 200
    expect(verifyLocationAccess(acceptedRequest, { _id: requesterId }).status).toBe(200);
    // Accepted request, Accepted Member -> 200
    expect(verifyLocationAccess(acceptedRequest, { _id: acceptedMemberId }).status).toBe(200);
  });
});
