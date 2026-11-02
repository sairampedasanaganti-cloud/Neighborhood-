/**
 * Seeds MongoDB Atlas with realistic demo data:
 * - Community Members across all 4 age groups (Teenager, Young Adult, Adult, Senior Citizen) + Admin
 * - Help Requests, Companionship Requests, and an Active Emergency Request
 * - Completed Activities, Reviews, Notifications, and Issue Reports
 *
 * Run: npm run seed (from /server)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Report = require('../models/Report');

async function seedData() {
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    HelpRequest.deleteMany({}),
    Notification.deleteMany({}),
    Review.deleteMany({}),
    Report.deleteMany({}),
  ]);

  console.log('[Seed] Creating Community Members across all age groups...');

  const users = await User.insertMany([
    {
      firebaseUid: 'demo-admin-uid',
      fullName: 'Asha Admin',
      email: 'admin@neighborlink.demo',
      mobile: '9876543210',
      phone: '9876543210',
      age: 35,
      ageGroup: 'adult',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      role: 'admin',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['General Help', 'Technology', 'Academic Support'],
      interests: ['Reading', 'Technology', 'Community'],
      availability: {
        weekdays: ['Morning', 'Afternoon', 'Evening'],
        weekends: ['Morning', 'Afternoon', 'Evening'],
        status: 'Available',
      },
    },
    {
      firebaseUid: 'demo-senior-uid',
      fullName: 'Srinivasan Ramanathan',
      email: 'senior@neighborlink.demo',
      mobile: '9876543211',
      phone: '9876543211',
      age: 68,
      ageGroup: 'senior',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      role: 'user',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['Academic Support', 'General Help'],
      interests: ['Reading', 'Music', 'Travel'],
      availability: {
        weekdays: ['Morning', 'Evening'],
        weekends: ['Morning'],
        status: 'Available',
      },
      ratingAverage: 4.9,
      ratingCount: 8,
      completedRequestsCount: 6,
    },
    {
      firebaseUid: 'demo-helper-uid',
      fullName: 'Karthik Subramanian',
      email: 'karthik@neighborlink.demo',
      mobile: '9876543212',
      phone: '9876543212',
      age: 28,
      ageGroup: 'adult',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      role: 'user',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['Programming', 'Technology', 'Household Assistance', 'Elderly Support'],
      volunteerSkills: ['Driving/Transport', 'Medicine Pickup', 'Grocery Shopping', 'Tech Support'],
      interests: ['Technology', 'Fitness', 'Music'],
      availability: {
        weekdays: ['Evening'],
        weekends: ['Morning', 'Afternoon', 'Evening'],
        status: 'Available',
      },
      ratingAverage: 4.8,
      ratingCount: 14,
      completedRequestsCount: 15,
    },
    {
      firebaseUid: 'demo-youngadult-uid',
      fullName: 'Sneha Patel',
      email: 'sneha@neighborlink.demo',
      mobile: '9876543213',
      phone: '9876543213',
      age: 22,
      ageGroup: 'young_adult',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      role: 'user',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['Academic Support', 'Programming', 'Pet Care'],
      interests: ['Art', 'Gaming', 'Reading'],
      availability: {
        weekdays: ['Afternoon', 'Evening'],
        weekends: ['Morning', 'Afternoon'],
        status: 'Available',
      },
      ratingAverage: 5.0,
      ratingCount: 5,
      completedRequestsCount: 5,
    },
    {
      firebaseUid: 'demo-teen-uid',
      fullName: 'Arjun Verma',
      email: 'arjun@neighborlink.demo',
      mobile: '9876543214',
      phone: '9876543214',
      age: 16,
      ageGroup: 'teenager',
      city: 'Chennai',
      community: 'Anna Nagar',
      neighborhood: 'Anna Nagar',
      role: 'user',
      verificationStatus: 'Verified',
      emailVerified: true,
      profileCompleted: true,
      skills: ['Programming', 'Gaming'],
      interests: ['Sports', 'Gaming', 'Technology'],
      availability: {
        weekdays: ['Evening'],
        weekends: ['Morning', 'Afternoon'],
        status: 'Available',
      },
      ratingAverage: 4.6,
      ratingCount: 3,
      completedRequestsCount: 2,
    },
  ]);

  const [admin, senior, karthik, sneha, arjun] = users;

  console.log('[Seed] Creating requests...');

  const requests = await HelpRequest.insertMany([
    // Senior Help Request
    {
      requester: senior._id,
      type: 'help',
      title: 'Need BP Medicine from Apollo Pharmacy Anna Nagar',
      description: 'Need urgent blood pressure tablet refill. Prescription is at the gate. Any kind neighbor visiting pharmacy please pick it up.',
      category: 'Medicine',
      helpCategory: 'medical_health',
      date: new Date().toISOString().split('T')[0],
      time: '6:00 PM',
      urgency: 'High',
      requesterUrgency: 'HIGH',
      city: 'Chennai',
      community: 'Anna Nagar',
      priority: 'HIGH',
      priorityScore: 75,
      priorityExplanation: ['Senior citizen health requirement (+40)', 'Urgent medicine pickup (+35)'],
      status: 'Pending',
    },
    // Teenager Help Request
    {
      requester: arjun._id,
      type: 'help',
      title: 'Programming Help – Java Recursion & Data Structures',
      description: 'Preparing for 11th grade CS practicals. Need someone with programming knowledge to explain recursive binary tree traversal.',
      category: 'Programming Help',
      helpCategory: 'technology_digital',
      date: new Date().toISOString().split('T')[0],
      time: '5:00 PM',
      urgency: 'Normal',
      requesterUrgency: 'MEDIUM',
      city: 'Chennai',
      community: 'Anna Nagar',
      requiredSkill: 'Programming',
      priority: 'MEDIUM',
      priorityScore: 50,
      priorityExplanation: ['Academic tutoring requirement (+30)', 'Scheduled learning (+20)'],
      status: 'Pending',
    },
    // Young Adult Education Request
    {
      requester: sneha._id,
      type: 'help',
      title: 'Exam Preparation – Calculus & Linear Algebra Tutoring',
      description: 'Need help preparing for university engineering mathematics semester exam. Looking for someone strong in calculus concepts.',
      category: 'Exam Preparation',
      helpCategory: 'education_academic',
      date: new Date().toISOString().split('T')[0],
      time: '4:00 PM',
      urgency: 'Normal',
      requesterUrgency: 'MEDIUM',
      city: 'Chennai',
      community: 'Anna Nagar',
      requiredSkill: 'Academic Support',
      priority: 'MEDIUM',
      priorityScore: 55,
      priorityExplanation: ['Academic support request (+35)', 'Scheduled exam preparation (+20)'],
      status: 'Pending',
    },
    // Senior Companionship Request
    {
      requester: senior._id,
      type: 'companionship',
      title: 'Evening Walk & Chat in Tower Park',
      description: 'Would love to have company for an evening stroll around Anna Nagar Tower Park between 5:30 PM and 6:30 PM.',
      category: 'Walk Together',
      helpCategory: 'companionship',
      date: new Date().toISOString().split('T')[0],
      time: '5:30 PM',
      urgency: 'Normal',
      city: 'Chennai',
      community: 'Anna Nagar',
      priority: 'LOW',
      priorityScore: 25,
      priorityExplanation: ['Social companionship (+25)'],
      status: 'Pending',
    },
    // Emergency Request (CRITICAL DEMO)
    {
      requester: senior._id,
      type: 'emergency',
      title: 'Sudden high fever and dizziness, need neighbor assistance to clinic',
      description: 'Living alone, feeling very faint. Need someone nearby to accompany to neighborhood clinic. In life threatening cases please note emergency ambulance was called.',
      category: 'Doctor Visit',
      helpCategory: 'medical_health',
      date: new Date().toISOString().split('T')[0],
      time: 'Immediate',
      urgency: 'Urgent',
      requesterUrgency: 'HIGH',
      city: 'Chennai',
      community: 'Anna Nagar',
      isEmergency: true,
      emergencyStatus: 'ACTIVE',
      priority: 'HIGH',
      priorityScore: 98,
      priorityExplanation: ['Active emergency request flagged for neighborhood mutual aid'],
      status: 'Pending',
    },
    // Completed Activity
    {
      requester: senior._id,
      acceptedMember: karthik._id,
      assignedVolunteer: karthik._id,
      type: 'help',
      title: 'Grocery items from Nilgiris Supermarket',
      description: 'Weekly milk, bread, and fruits pickup.',
      category: 'Shopping Help',
      helpCategory: 'daily_assistance',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      time: '11:00 AM',
      urgency: 'Normal',
      city: 'Chennai',
      community: 'Anna Nagar',
      priority: 'LOW',
      priorityScore: 20,
      status: 'Completed',
      acceptedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 82800000),
      requesterReviewed: true,
      helperReviewed: true,
      statusHistory: [
        { status: 'Pending', changedAt: new Date(Date.now() - 90000000), note: 'Posted' },
        { status: 'Accepted', changedAt: new Date(Date.now() - 86400000), note: 'Accepted by Karthik' },
        { status: 'In Progress', changedAt: new Date(Date.now() - 85000000), note: 'Shopping underway' },
        { status: 'Completed', changedAt: new Date(Date.now() - 82800000), note: 'Delivered groceries safely' },
      ],
    },
  ]);

  console.log('[Seed] Creating reviews & ratings...');
  await Review.create({
    request: requests[4]._id,
    reviewer: senior._id,
    reviewee: karthik._id,
    rating: 5,
    comment: 'Karthik was wonderfully polite, brought the exact groceries on time. True community spirit!',
    role: 'requester_to_volunteer',
  });

  console.log('[Seed] Creating issue report for moderation demo...');
  await Report.create({
    requestId: requests[1]._id,
    reporter: karthik._id,
    reportedUser: arjun._id,
    reason: 'False Request',
    description: 'Testing report mechanism: Verified member asked to check request authenticity.',
    status: 'Open',
  });

  console.log('[Seed] Creating notifications...');
  await Notification.insertMany([
    {
      user: karthik._id,
      type: 'EMERGENCY_ALERT',
      title: '🚨 Urgent Emergency in Your Community',
      message: `URGENT: Srinivasan Ramanathan needs emergency help in Anna Nagar: "${requests[3].title}"`,
      priority: 'URGENT',
      relatedRequest: requests[3]._id,
    },
    {
      user: karthik._id,
      type: 'GOOD_MATCH',
      title: '🎯 Good Match for You!',
      message: `Arjun Verma is looking for Programming Help: "${requests[1].title}". You match because of your Programming skill and Anna Nagar community.`,
      priority: 'NORMAL',
      matchReasons: ['✓ Programming skill (+50%)', '✓ Available at requested time (+30%)', '✓ Same community: Anna Nagar (+20%)'],
      relatedRequest: requests[1]._id,
    },
    {
      user: senior._id,
      type: 'REQUEST_COMPLETED',
      title: '🎉 Activity Completed!',
      message: 'Your grocery request was completed by Karthik Subramanian.',
      relatedRequest: requests[4]._id,
    },
  ]);

  console.log('[Seed] Database seeded successfully with complete production demo data.');
  console.log('\n================ DEMO ACCOUNTS ================');
  users.forEach((u) => {
    console.log(`- ${u.fullName} (${u.email}) [Age: ${u.age} | ${u.ageGroup} | Role: ${u.role}]`);
  });
  console.log('================================================\n');

  return { users, requests };
}

async function seed() {
  await connectDB();
  await seedData();
  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = { seedData, seed };
