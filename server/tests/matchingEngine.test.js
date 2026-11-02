const { calculateMatchScore, rankVolunteers } = require('../services/matchingEngine');

const baseRequest = {
  category: 'Tutoring',
  requiredSkill: '',
  priority: 'MEDIUM',
  location: { lat: 12.97, lng: 77.59 },
};

describe('matchingEngine.calculateMatchScore', () => {
  test('volunteer with matching skill scores higher than one without', () => {
    const tutor = {
      volunteerSkills: ['Tutoring'], availability: 'Available', ratingAverage: 4,
      location: { lat: 12.971, lng: 77.591 },
    };
    const nonTutor = {
      volunteerSkills: ['Grocery Shopping'], availability: 'Available', ratingAverage: 4,
      location: { lat: 12.971, lng: 77.591 },
    };
    const tutorScore = calculateMatchScore(tutor, baseRequest).score;
    const nonTutorScore = calculateMatchScore(nonTutor, baseRequest).score;
    expect(tutorScore).toBeGreaterThan(nonTutorScore);
  });

  test('closer volunteer scores higher than a far volunteer, all else equal', () => {
    const near = { volunteerSkills: ['Tutoring'], availability: 'Available', ratingAverage: 4, location: { lat: 12.971, lng: 77.591 } };
    const far = { volunteerSkills: ['Tutoring'], availability: 'Available', ratingAverage: 4, location: { lat: 13.5, lng: 78.2 } };
    expect(calculateMatchScore(near, baseRequest).score).toBeGreaterThan(calculateMatchScore(far, baseRequest).score);
  });

  test('rankVolunteers sorts best match first', () => {
    const volunteers = [
      { _id: 1, volunteerSkills: [], availability: 'Unavailable', ratingAverage: 1, location: { lat: 20, lng: 80 } },
      { _id: 2, volunteerSkills: ['Tutoring'], availability: 'Available', ratingAverage: 5, location: { lat: 12.971, lng: 77.591 } },
    ];
    const ranked = rankVolunteers(volunteers, baseRequest);
    expect(ranked[0].volunteer._id).toBe(2);
  });
});
