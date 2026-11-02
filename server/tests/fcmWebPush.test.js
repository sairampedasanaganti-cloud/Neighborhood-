const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const { sendRequestNotificationPush } = require('../services/fcmService');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await HelpRequest.deleteMany({});
  await User.deleteMany({});
});

describe('FCM Web Push Tokens & Notification Safeguards', () => {
  test('User schema properly stores, updates, and prunes duplicate FCM tokens', async () => {
    const user = await User.create({
      firebaseUid: 'fcm-user-1',
      fullName: 'Push Tester',
      email: 'push@test.com',
      fcmTokens: [],
    });

    // 1. Add first token
    user.fcmTokens.push({ token: 'test-token-abc', deviceType: 'web', updatedAt: new Date() });
    await user.save();

    let fetched = await User.findById(user._id);
    expect(fetched.fcmTokens).toHaveLength(1);
    expect(fetched.fcmTokens[0].token).toBe('test-token-abc');

    // 2. Updating same token should not duplicate
    const existingIdx = fetched.fcmTokens.findIndex((t) => t.token === 'test-token-abc');
    if (existingIdx > -1) {
      fetched.fcmTokens[existingIdx].updatedAt = new Date();
    } else {
      fetched.fcmTokens.push({ token: 'test-token-abc', deviceType: 'web' });
    }
    await fetched.save();

    fetched = await User.findById(user._id);
    expect(fetched.fcmTokens).toHaveLength(1);

    // 3. Remove token
    fetched.fcmTokens = fetched.fcmTokens.filter((t) => t.token !== 'test-token-abc');
    await fetched.save();

    fetched = await User.findById(user._id);
    expect(fetched.fcmTokens).toHaveLength(0);
  });

  test('sendRequestNotificationPush excludes requester from receiving push notification for own request', async () => {
    const requester = await User.create({
      firebaseUid: 'requester-1',
      fullName: 'Requester Member',
      email: 'req@test.com',
      community: 'Anna Nagar',
      fcmTokens: [{ token: 'requester-fcm-token', deviceType: 'web' }],
    });

    const candidate = await User.create({
      firebaseUid: 'candidate-1',
      fullName: 'Candidate Member',
      email: 'cand@test.com',
      community: 'Anna Nagar',
      fcmTokens: [{ token: 'candidate-fcm-token', deviceType: 'web' }],
    });

    const request = await HelpRequest.create({
      requester: requester._id,
      title: 'Need tutoring help',
      description: 'Help with math',
      category: 'Tutoring',
      community: 'Anna Nagar',
    });

    // Mock admin.messaging().sendEachForMulticast
    const admin = require('../config/firebase');
    let capturedMessage = null;

    const mockMessaging = {
      sendEachForMulticast: jest.fn().mockImplementation(async (msg) => {
        capturedMessage = msg;
        return { successCount: msg.tokens.length, failureCount: 0, responses: [] };
      }),
    };
    jest.spyOn(admin, 'messaging').mockReturnValue(mockMessaging);

    const recipientIds = [requester._id, candidate._id];

    await sendRequestNotificationPush({
      request,
      recipientIds,
      isEmergency: false,
    });

    // Check that requester token was NOT included in multicast recipients
    expect(capturedMessage).not.toBeNull();
    expect(capturedMessage.tokens).toContain('candidate-fcm-token');
    expect(capturedMessage.tokens).not.toContain('requester-fcm-token');
  });

  test('Push notifications do not expose exact addresses or live GPS coordinates', async () => {
    const requester = await User.create({
      firebaseUid: 'req-2',
      fullName: 'Privacy User',
      email: 'priv@test.com',
      community: 'Besant Nagar',
    });

    const recipient = await User.create({
      firebaseUid: 'rec-2',
      fullName: 'Neighbor User',
      email: 'neighbor@test.com',
      community: 'Besant Nagar',
      fcmTokens: [{ token: 'neighbor-fcm-token', deviceType: 'web' }],
    });

    const request = await HelpRequest.create({
      requester: requester._id,
      title: 'Emergency Medical Alert',
      description: 'Need oxygen cylinder at 42 Private Street Apartment 302',
      category: 'Medical',
      community: 'Besant Nagar',
      location: {
        address: '42 Private Street Apartment 302',
        lat: 13.0012,
        lng: 80.2567,
      },
      isEmergency: true,
    });

    const admin = require('../config/firebase');
    let capturedMessage = null;

    const mockMessaging = {
      sendEachForMulticast: jest.fn().mockImplementation(async (msg) => {
        capturedMessage = msg;
        return { successCount: 1, failureCount: 0, responses: [] };
      }),
    };
    jest.spyOn(admin, 'messaging').mockReturnValue(mockMessaging);

    await sendRequestNotificationPush({
      request,
      recipientIds: [recipient._id],
      isEmergency: true,
    });

    expect(capturedMessage).not.toBeNull();
    // Notification title & body must NOT contain exact address or GPS lat/lng
    const payloadStr = JSON.stringify(capturedMessage);
    expect(payloadStr).not.toContain('42 Private Street Apartment 302');
    expect(payloadStr).not.toContain('13.0012');
    expect(payloadStr).not.toContain('80.2567');

    // But it should mention the general neighborhood community area
    expect(payloadStr).toContain('Besant Nagar');
    expect(capturedMessage.data.url).toBe(`/requests/${request._id}`);
  });
});
