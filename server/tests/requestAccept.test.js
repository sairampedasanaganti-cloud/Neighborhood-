/**
 * Integration test: verifies that when two "volunteers" race to accept the
 * same Pending request, only one succeeds — proving the DB-level safeguard
 * (atomic findOneAndUpdate with status:'Pending' in the filter) actually works.
 * Uses an in-memory MongoDB instance so no real Atlas cluster is required.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

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

async function acceptOnce(requestId, volunteerId) {
  return HelpRequest.findOneAndUpdate(
    { _id: requestId, status: 'Pending' },
    { $set: { status: 'Accepted', assignedVolunteer: volunteerId, acceptedAt: new Date() } },
    { new: true }
  );
}

test('only one of two simultaneous accept attempts succeeds', async () => {
  const requester = await User.create({ firebaseUid: 'u1', fullName: 'Requester', email: 'r@test.com' });
  const volA = await User.create({ firebaseUid: 'u2', fullName: 'Volunteer A', email: 'a@test.com' });
  const volB = await User.create({ firebaseUid: 'u3', fullName: 'Volunteer B', email: 'b@test.com' });

  const request = await HelpRequest.create({
    requester: requester._id,
    title: 'Test request',
    description: 'Test description',
    category: 'Grocery Pickup',
  });

  const [resultA, resultB] = await Promise.all([
    acceptOnce(request._id, volA._id),
    acceptOnce(request._id, volB._id),
  ]);

  const successes = [resultA, resultB].filter(Boolean);
  expect(successes.length).toBe(1);

  const finalRequest = await HelpRequest.findById(request._id);
  expect(finalRequest.status).toBe('Accepted');
  expect([String(volA._id), String(volB._id)]).toContain(String(finalRequest.assignedVolunteer));
});
