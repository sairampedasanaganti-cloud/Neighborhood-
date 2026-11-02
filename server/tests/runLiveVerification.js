/**
 * Automated End-to-End Verification Test Script
 * Uses native Node.js fetch (Node 18+) to validate live API behavior.
 */
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'neighborlink_jwt_secure_secret_2024';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE E2E VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data?.success, 'Backend health API is active');

    // 2. Demo logins
    const adminLogin = await request(`${BASE_URL}/users/demo-login`, {
      method: 'POST',
      body: JSON.stringify({ role: 'admin' }),
    });
    assert(adminLogin.status === 200 && adminLogin.data?.data?.token, 'Case C: Admin demo login returns token');

    const seniorLogin = await request(`${BASE_URL}/users/demo-login`, {
      method: 'POST',
      body: JSON.stringify({ role: 'senior' }),
    });
    assert(seniorLogin.status === 200 && seniorLogin.data?.data?.user?.ageGroup === 'senior', 'Case C: Senior citizen account verified and assigned senior ageGroup');

    const helperLogin = await request(`${BASE_URL}/users/demo-login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'karthik@neighborlink.demo' }),
    });
    assert(helperLogin.status === 200, 'Case C: Member helper account verified');

    const userCLogin = await request(`${BASE_URL}/users/demo-login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'sneha@neighborlink.demo' }),
    });
    assert(userCLogin.status === 200, 'Case C: Third member (User C) verified');

    const seniorToken = seniorLogin.data.data.token;
    const helperToken = helperLogin.data.data.token;
    const userCToken = userCLogin.data.data.token;

    // 3. Test Case G: Create a new pending request from Senior and test Location Privacy
    const createRes = await request(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
      body: JSON.stringify({
        title: 'Need assistance with medicine purchase',
        description: 'Please help collect prescription from Apollo Pharmacy.',
        category: 'Medicine Delivery',
        urgency: 'High',
        city: 'Chennai',
        community: 'Anna Nagar',
        location: { address: 'Flat 4B, 12th Main Road, Anna Nagar', lat: 13.0850, lng: 80.2150 },
      }),
    });
    assert(createRes.status === 201 && createRes.data?.data?.status === 'Pending', 'Case G: Pending request created successfully');
    const reqId = createRes.data.data._id;

    // Test Case G: Pending request seen by User C via browseRequests does NOT reveal exact location
    const browseRes = await request(`${BASE_URL}/requests?city=Chennai`, {
      headers: { Authorization: `Bearer ${userCToken}` },
    });
    const foundPending = (browseRes.data?.data || []).find((r) => r._id === reqId);
    assert(
      foundPending && foundPending.locationAccessGranted === false && foundPending.location.lat === null,
      'Case G: Pending request masked in public feed — coordinates are null, locationAccessGranted is false'
    );

    // Test Case J: Direct location API access while request is still Pending
    const pendingLoc = await request(`${BASE_URL}/requests/${reqId}/location`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    assert(pendingLoc.status === 403, 'Case J: Direct location API returned 403 for Pending request');

    // 4. Test Case H: Helper accepts the request
    const acceptRes = await request(`${BASE_URL}/requests/${reqId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${helperToken}` },
      body: JSON.stringify({}),
    });
    assert(acceptRes.status === 200 && acceptRes.data?.data?.status === 'Accepted', 'Case H: Helper successfully accepted the request');

    // Test Case H: Requester accesses location endpoint
    const locForRequester = await request(`${BASE_URL}/requests/${reqId}/location`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    assert(
      locForRequester.status === 200 &&
      locForRequester.data?.data?.requesterLocation &&
      locForRequester.data?.data?.acceptedMemberLocation,
      'Case H: Requester can access mutual location details after acceptance'
    );

    // Test Case H: Accepted Member accesses location endpoint
    const locForHelper = await request(`${BASE_URL}/requests/${reqId}/location`, {
      headers: { Authorization: `Bearer ${helperToken}` },
    });
    assert(
      locForHelper.status === 200 &&
      locForHelper.data?.data?.requesterLocation &&
      locForHelper.data?.data?.acceptedMemberLocation,
      'Case H: Accepted Member can access mutual location details after acceptance'
    );

    // 5. Test Case I & J: Third party (User C) attempts to access location endpoint
    const locForUserC = await request(`${BASE_URL}/requests/${reqId}/location`, {
      headers: { Authorization: `Bearer ${userCToken}` },
    });
    assert(locForUserC.status === 403, 'Case I & J: Third party (User C) receives 403 Forbidden on location endpoint');

    // Test Case J: Unauthenticated caller attempts to access location endpoint
    const locUnauth = await request(`${BASE_URL}/requests/${reqId}/location`);
    assert(locUnauth.status === 401, 'Case J: Unauthenticated location API request rejected with 401 Unauthorized');

    // 6. Test Case D: Invalid / expired token rejected
    const invalidAuth = await request(`${BASE_URL}/users/me`, {
      headers: { Authorization: 'Bearer invalid.token.value' },
    });
    assert(invalidAuth.status === 401, 'Case D: Protected route rejects invalid token with 401');

    // 7. Test Case A: User registration profile creation
    const testRegEmail = `testuser_${Date.now()}@neighborlink.demo`;
    const regRes = await request(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt.sign({ uid: `test-${Date.now()}`, email: testRegEmail }, JWT_SECRET)}`,
      },
      body: JSON.stringify({
        fullName: 'New Community Neighbor',
        email: testRegEmail,
        mobile: '9123456780',
      }),
    });
    assert(
      regRes.status === 201 && regRes.data?.data?.fullName === 'New Community Neighbor',
      'Case A: New user registration profile created in MongoDB'
    );

    console.log(`\n================ TEST SUMMARY ================`);
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`==============================================`);

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (globalErr) {
    console.error('Fatal test error:', globalErr);
    process.exit(1);
  }
}

runTests();
