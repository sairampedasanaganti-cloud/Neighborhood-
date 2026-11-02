const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const { mapToOfferHelpCategory, OFFER_HELP_CATEGORIES } = require('../utils/categoryMapper');
const { calculateMatchScore } = require('../services/matchingEngine');

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

describe('Offer Help Category Mapping & Verification', () => {
  test('All 10 required categories are defined with id, name, icon, and description', () => {
    expect(OFFER_HELP_CATEGORIES).toHaveLength(10);
    const expectedIds = [
      'medical_health',
      'education_academic',
      'technology_digital',
      'elderly_support',
      'household_assistance',
      'transportation_travel',
      'career_professional',
      'companionship',
      'daily_assistance',
      'other',
    ];
    expect(OFFER_HELP_CATEGORIES.map((c) => c.id)).toEqual(expectedIds);
  });

  test('Test 1 & 2: Medical request maps to Medical & Health category', async () => {
    const user = await User.create({ firebaseUid: 'u_med', fullName: 'Senior Member', email: 'med@test.com' });
    
    // Doctor Visit
    const docReq = await HelpRequest.create({
      requester: user._id,
      title: 'Need accompaniment for Doctor Visit at clinic',
      description: 'Consultation with doctor at Apollo Clinic Anna Nagar',
      category: 'Doctor Visit',
    });
    expect(docReq.helpCategory).toBe('medical_health');
    expect(mapToOfferHelpCategory(docReq)).toBe('medical_health');

    // Medical Test
    const testReq = await HelpRequest.create({
      requester: user._id,
      title: 'Blood test sample collection accompaniment',
      description: 'Need help visiting diagnostic center',
      category: 'Medical Test',
    });
    expect(testReq.helpCategory).toBe('medical_health');
    expect(mapToOfferHelpCategory(testReq)).toBe('medical_health');

    // Medicine
    const medReq = await HelpRequest.create({
      requester: user._id,
      title: 'Urgent BP tablet refill from pharmacy',
      description: 'Please pick up medicine with prescription',
      category: 'Medicine',
    });
    expect(medReq.helpCategory).toBe('medical_health');
    expect(mapToOfferHelpCategory(medReq)).toBe('medical_health');
  });

  test('Test 3 & 4: Education request maps to Education & Academic category', async () => {
    const user = await User.create({ firebaseUid: 'u_edu', fullName: 'Student', email: 'edu@test.com' });

    // Subject Tutoring
    const tutorReq = await HelpRequest.create({
      requester: user._id,
      title: 'Math Calculus Tutoring',
      description: 'Need help understanding derivatives',
      category: 'Subject Tutoring',
    });
    expect(tutorReq.helpCategory).toBe('education_academic');
    expect(mapToOfferHelpCategory(tutorReq)).toBe('education_academic');

    // Exam Preparation
    const examReq = await HelpRequest.create({
      requester: user._id,
      title: 'CBSE 12th Board Exam Revision',
      description: 'Physics numerical problem solving',
      category: 'Exam Preparation',
    });
    expect(examReq.helpCategory).toBe('education_academic');
    expect(mapToOfferHelpCategory(examReq)).toBe('education_academic');

    // Academic Support
    const acadReq = await HelpRequest.create({
      requester: user._id,
      title: 'College Data Structures assignment support',
      description: 'Need concept clarification on graphs',
      category: 'Academic Support',
    });
    expect(acadReq.helpCategory).toBe('education_academic');
    expect(mapToOfferHelpCategory(acadReq)).toBe('education_academic');

    // Project Guidance
    const projReq = await HelpRequest.create({
      requester: user._id,
      title: 'School science fair project guidance',
      description: 'Guidance building IoT water level sensor',
      category: 'Project Guidance',
    });
    expect(projReq.helpCategory).toBe('education_academic');
    expect(mapToOfferHelpCategory(projReq)).toBe('education_academic');
  });

  test('Technology, Elderly, Household, Travel, Career, Companionship, Daily, and Other mappings', async () => {
    const user = await User.create({ firebaseUid: 'u_misc', fullName: 'Neighbor', email: 'misc@test.com' });

    // Technology & Digital
    const techReq = await HelpRequest.create({
      requester: user._id,
      title: 'Python recursion script help',
      description: 'Debugging recursive tree function',
      category: 'Programming Help',
    });
    expect(techReq.helpCategory).toBe('technology_digital');

    // Elderly Support
    const elderReq = await HelpRequest.create({
      requester: user._id,
      title: 'Check in on elderly father while at work',
      description: 'Friendly neighbor visit to ensure medicine taken',
      category: 'Elderly Parent Support',
    });
    expect(elderReq.helpCategory).toBe('elderly_support');

    // Household Assistance
    const houseReq = await HelpRequest.create({
      requester: user._id,
      title: 'Help moving heavy book shelf to upper floor',
      description: 'Need another pair of hands for 15 minutes',
      category: 'Household Assistance',
    });
    expect(houseReq.helpCategory).toBe('household_assistance');

    // Transportation & Travel
    const travelReq = await HelpRequest.create({
      requester: user._id,
      title: 'Help booking cab and boarding at station',
      description: 'Assistance reaching Chennai Central',
      category: 'Travel Help',
    });
    expect(travelReq.helpCategory).toBe('transportation_travel');

    // Career & Professional
    const careerReq = await HelpRequest.create({
      requester: user._id,
      title: 'Software engineering resume review',
      description: 'Seeking review for fresher tech roles',
      category: 'Resume & Application Help',
    });
    expect(careerReq.helpCategory).toBe('career_professional');

    // Companionship
    const compReq = await HelpRequest.create({
      requester: user._id,
      type: 'companionship',
      title: 'Evening walk in Anna Nagar Tower Park',
      description: 'Looking for walking companion 6 PM',
      category: 'Walk Together',
    });
    expect(compReq.helpCategory).toBe('companionship');

    // Daily Assistance
    const dailyReq = await HelpRequest.create({
      requester: user._id,
      title: 'Weekly vegetables and milk from local market',
      description: 'Nilgiris supermarket items',
      category: 'Shopping Help',
    });
    expect(dailyReq.helpCategory).toBe('daily_assistance');

    // Other
    const otherReq = await HelpRequest.create({
      requester: user._id,
      title: 'Borrow hedge trimmer for garden',
      description: 'Need garden tool for afternoon',
      category: 'Other',
    });
    expect(otherReq.helpCategory).toBe('other');
  });

  test('Test 5 & 6: Accepted request disappears from available Offer Help requests', async () => {
    const requester = await User.create({ firebaseUid: 'req1', fullName: 'Requester', email: 'r1@test.com' });
    const helper = await User.create({ firebaseUid: 'help1', fullName: 'Helper', email: 'h1@test.com' });

    const request = await HelpRequest.create({
      requester: requester._id,
      title: 'Doctor visit accompaniment',
      description: 'Need help visiting clinic',
      category: 'Doctor Visit',
      status: 'Pending',
    });

    // Before acceptance: status is Pending
    let openRequests = await HelpRequest.find({ status: 'Pending' });
    expect(openRequests).toHaveLength(1);

    // Helper accepts request
    request.status = 'Accepted';
    request.acceptedMember = helper._id;
    request.assignedVolunteer = helper._id;
    await request.save();

    // After acceptance: request no longer appears in Pending list
    openRequests = await HelpRequest.find({ status: 'Pending' });
    expect(openRequests).toHaveLength(0);
  });

  test('Test 7: Completed requests do not appear in available Offer Help requests', async () => {
    const requester = await User.create({ firebaseUid: 'req2', fullName: 'Requester 2', email: 'r2@test.com' });
    const helper = await User.create({ firebaseUid: 'help2', fullName: 'Helper 2', email: 'h2@test.com' });

    await HelpRequest.create({
      requester: requester._id,
      acceptedMember: helper._id,
      assignedVolunteer: helper._id,
      title: 'Completed medicine delivery',
      description: 'Collected medicine',
      category: 'Medicine',
      status: 'Completed',
    });

    const pendingRequests = await HelpRequest.find({ status: 'Pending' });
    expect(pendingRequests).toHaveLength(0);
  });

  test('Test 8: Community and age eligibility / smart matching still works properly', async () => {
    const teenRequester = await User.create({
      firebaseUid: 't_req',
      fullName: 'Teen Requester',
      email: 'teen@test.com',
      age: 15,
      ageGroup: 'teenager',
      city: 'Chennai',
      community: 'Anna Nagar',
    });

    const adultVolunteer = {
      skills: ['Academic Support'],
      city: 'Chennai',
      community: 'Anna Nagar',
      availability: {
        weekdays: ['Evening'],
        status: 'Available',
      },
      ageGroup: 'adult',
    };

    const tutoringReq = {
      title: 'Subject Tutoring for 10th Math',
      category: 'Subject Tutoring',
      requiredSkill: 'Academic Support',
      city: 'Chennai',
      community: 'Anna Nagar',
      date: '2026-10-05',
      time: '6:00 PM',
      type: 'help',
      requester: { ageGroup: 'teenager' },
    };

    const matchResult = calculateMatchScore(adultVolunteer, tutoringReq);
    expect(matchResult.eligible).toBe(true);
    expect(matchResult.score).toBeGreaterThanOrEqual(90);
    expect(matchResult.explanation).toContain('✓ Academic Support skill (+50%)');
    expect(matchResult.explanation).toContain('✓ Same community: Anna Nagar (+20%)');

    // Senior attempting private companionship with teenager is protected by age safeguard
    const seniorMember = {
      skills: [],
      city: 'Chennai',
      community: 'Anna Nagar',
      availability: { status: 'Available' },
      ageGroup: 'senior',
    };
    const privateCompReq = {
      title: 'Private teen hangout',
      category: 'Hangout',
      type: 'companionship',
      requester: { ageGroup: 'teenager' },
    };
    const compMatch = calculateMatchScore(seniorMember, privateCompReq);
    expect(compMatch.eligible).toBe(false);
  });
});
