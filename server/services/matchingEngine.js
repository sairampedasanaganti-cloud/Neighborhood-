/**
 * SMART MATCHING ENGINE
 * ---------------------
 * Explainable, transparent rule-based matching engine for NeighborLink.
 *
 * Weighting (sum to 100%):
 *   Skills match        -> 50%
 *   Availability match  -> 30%
 *   Community / Area    -> 20%
 *
 * Age Suitability Filter:
 *   Acts as an eligibility/safety filter (not just adding points)
 *   Ensures safe peer/adult interactions, especially for teenagers (10–17).
 */

const { distanceKm } = require('../utils/distance');

const SKILL_MAP = {
  // Academic & Tutoring
  'Subject Tutoring': ['Academic Support', 'Tutoring'],
  'Exam Preparation': ['Academic Support', 'Tutoring'],
  'Academic Support': ['Academic Support', 'Tutoring'],
  'Tutoring': ['Academic Support', 'Tutoring'],

  // Technical & Programming
  'Programming Help': ['Programming', 'Technology', 'Technical Help'],
  'Technical Help': ['Programming', 'Technology', 'Technical Help'],
  'Digital Service Help': ['Technology', 'Tech Support'],
  'Phone Help': ['Technology', 'Tech Support'],
  'Tech Support': ['Technology', 'Tech Support', 'Programming'],

  // Project & Career Guidance
  'Project Guidance': ['Academic Support', 'Programming', 'Technology'],
  'Career Guidance': ['Academic Support', 'General Help'],
  'Resume & Application Help': ['Academic Support', 'General Help'],
  'Skill Development': ['Academic Support', 'General Help'],

  // Elderly & Health
  'Elderly Parent Support': ['Elderly Support', 'General Help'],
  'Elderly Care': ['Elderly Support'],
  'Medicine': ['Elderly Support', 'Medicine Pickup', 'Household Assistance'],
  'Medicine Pickup': ['Medicine Pickup', 'Household Assistance', 'Elderly Support'],
  'Doctor Visit': ['Elderly Support', 'Driving/Transport', 'General Help'],
  'Medical Test': ['Elderly Support', 'Driving/Transport'],
  'Medical Appointment Assistance': ['Elderly Support', 'Driving/Transport'],
  'Illness & Recovery Support': ['Elderly Support', 'Household Assistance'],
  'Emergency Transport': ['Driving/Transport'],

  // Household & Errands
  'Household Assistance': ['Household Assistance', 'General Help'],
  'Grocery Pickup': ['Household Assistance', 'Grocery Shopping'],
  'Shopping Help': ['Household Assistance', 'Grocery Shopping'],
  'Home Help': ['Household Assistance', 'General Help'],
  'Important Errands': ['Household Assistance', 'General Help'],
  'Banking': ['Elderly Support', 'Household Assistance', 'General Help'],
  'Government Work': ['Elderly Support', 'Household Assistance', 'General Help'],
  'Documents': ['Elderly Support', 'Household Assistance', 'Academic Support'],
  'Childcare Support': ['Household Assistance', 'General Help'],
  'Pet Care': ['Pet Care', 'General Help'],
  'Other Community Help': ['General Help'],
  'General Help': ['General Help'],
};

/**
 * Checks age suitability for safety.
 * Returns { eligible: boolean, reason: string }
 */
function checkAgeSafety(member, request) {
  const requesterAgeGroup = request.requester?.ageGroup || 'adult';
  const memberAgeGroup = member.ageGroup || 'adult';

  // Safeguards for Teenagers
  if (requesterAgeGroup === 'teenager') {
    // If it's private companionship, only fellow teenagers or verified members
    if (request.type === 'companionship') {
      if (memberAgeGroup === 'senior' && !request.category?.toLowerCase().includes('event')) {
        return { eligible: false, reason: 'Age suitability safeguard for teenager activity' };
      }
    }
  }

  return { eligible: true, reason: 'Age-appropriate match' };
}

/**
 * Evaluates skill match (50% weight).
 */
function evaluateSkills(member, request) {
  const memberSkills = [
    ...(member.skills || []),
    ...(member.volunteerSkills || []),
  ];

  const targetCategory = request.category || request.requiredSkill || '';
  const expectedSkills = SKILL_MAP[targetCategory] || [targetCategory];

  // Direct skill match
  const matchedSkill = memberSkills.find((s) =>
    expectedSkills.some((es) => es.toLowerCase() === s.toLowerCase()) ||
    targetCategory.toLowerCase().includes(s.toLowerCase()) ||
    (request.title && request.title.toLowerCase().includes(s.toLowerCase())) ||
    (request.description && request.description.toLowerCase().includes(s.toLowerCase()))
  );

  if (matchedSkill) {
    return {
      points: 50,
      reason: `✓ ${matchedSkill} skill (+50%)`,
      hasMatch: true,
    };
  }

  // Companionship activity match via interests
  if (request.type === 'companionship' && member.interests?.length) {
    const matchedInterest = member.interests.find((interest) =>
      targetCategory.toLowerCase().includes(interest.toLowerCase()) ||
      (request.title && request.title.toLowerCase().includes(interest.toLowerCase()))
    );
    if (matchedInterest) {
      return {
        points: 45,
        reason: `✓ Shared interest in ${matchedInterest} (+45%)`,
        hasMatch: true,
      };
    }
  }

  // General help fallback
  if (memberSkills.some((s) => s.toLowerCase() === 'general help')) {
    return {
      points: 25,
      reason: '✓ General community assistance skill (+25%)',
      hasMatch: true,
    };
  }

  return {
    points: 10,
    reason: 'Open community support (+10%)',
    hasMatch: false,
  };
}

/**
 * Evaluates availability match (30% weight).
 */
function evaluateAvailability(member, request) {
  const avail = member.availability || {};
  const status = typeof avail === 'string' ? avail : avail.status || 'Available';

  if (status === 'Unavailable') {
    return { points: 0, reason: 'Currently unavailable (+0%)', available: false };
  }

  if (status === 'Busy') {
    return { points: 10, reason: 'Currently busy (+10%)', available: true };
  }

  // Check structured weekday/weekend availability
  const reqDateStr = request.date || '';
  let isWeekend = false;
  if (reqDateStr) {
    const d = new Date(reqDateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      isWeekend = day === 0 || day === 6;
    }
  }

  const reqTimeStr = (request.time || '').toLowerCase();
  let timeSlot = 'Evening';
  if (reqTimeStr.includes('morning') || reqTimeStr.includes('am')) timeSlot = 'Morning';
  else if (reqTimeStr.includes('afternoon')) timeSlot = 'Afternoon';

  const memberSlots = isWeekend
    ? (avail.weekends || ['Morning', 'Afternoon'])
    : (avail.weekdays || ['Evening']);

  if (memberSlots.includes(timeSlot)) {
    return {
      points: 30,
      reason: `✓ Available at requested time (${timeSlot}) (+30%)`,
      available: true,
    };
  }

  return {
    points: 20,
    reason: '✓ Generally available in community (+20%)',
    available: true,
  };
}

/**
 * Evaluates community / area match (20% weight).
 */
function evaluateCommunity(member, request) {
  const memberCity = (member.city || '').trim().toLowerCase();
  const memberComm = (member.community || member.neighborhood || '').trim().toLowerCase();

  const reqCity = (request.city || '').trim().toLowerCase();
  const reqComm = (request.community || request.neighborhood || request.location?.address || '').trim().toLowerCase();

  // Same community
  if (memberComm && reqComm && (memberComm.includes(reqComm) || reqComm.includes(memberComm))) {
    return {
      points: 20,
      reason: `✓ Same community: ${member.community || member.neighborhood} (+20%)`,
      sameCommunity: true,
    };
  }

  // Same city
  if (memberCity && reqCity && memberCity === reqCity) {
    return {
      points: 15,
      reason: `✓ Same city: ${member.city} (+15%)`,
      sameCommunity: false,
    };
  }

  // Proximity fallback if coordinates exist
  const dist = distanceKm(
    member.location?.lat, member.location?.lng,
    request.location?.lat, request.location?.lng
  );
  if (dist !== null) {
    if (dist <= 3) return { points: 20, reason: `✓ Nearby location: ${dist} km (+20%)`, sameCommunity: true };
    if (dist <= 10) return { points: 15, reason: `✓ Within district: ${dist} km (+15%)`, sameCommunity: false };
  }

  return { points: 5, reason: 'Neighboring area (+5%)', sameCommunity: false };
}

/**
 * Calculate transparent 0–100 match score between a Community Member and a Request.
 * @returns {{ score: number, explanation: string[], eligible: boolean }}
 */
function calculateMatchScore(member, request) {
  // Safety filter
  const safety = checkAgeSafety(member, request);
  if (!safety.eligible) {
    return { score: 0, explanation: [safety.reason], eligible: false };
  }

  const skillResult = evaluateSkills(member, request);
  const availResult = evaluateAvailability(member, request);
  const commResult = evaluateCommunity(member, request);

  const totalScore = Math.min(100, Math.max(0, skillResult.points + availResult.points + commResult.points));

  const explanation = [
    skillResult.reason,
    availResult.reason,
    commResult.reason,
  ];

  return {
    score: totalScore,
    explanation,
    eligible: true,
  };
}

/**
 * Rank a list of candidate community members for a request.
 */
function rankVolunteers(members, request) {
  return members
    .map((member) => ({
      volunteer: member,
      member,
      ...calculateMatchScore(member, request),
    }))
    .filter((r) => r.eligible)
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  calculateMatchScore,
  rankVolunteers,
  checkAgeSafety,
  CATEGORY_TO_SKILL: SKILL_MAP,
};
