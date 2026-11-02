const { calculateMatchScore, checkAgeSafety } = require('../services/matchingEngine');
const User = require('../models/User');

describe('Smart Matching Engine (50% Skills, 30% Availability, 20% Community)', () => {
  const request = {
    title: 'Need Java programming guidance',
    category: 'Programming Help',
    requiredSkill: 'Programming',
    city: 'Chennai',
    community: 'Anna Nagar',
    date: '2026-09-15',
    time: '6:00 PM',
    type: 'help',
    requester: { ageGroup: 'teenager' },
  };

  test('Full match on skill, availability, and community scores high (>90%)', () => {
    const perfectMember = {
      skills: ['Programming'],
      city: 'Chennai',
      community: 'Anna Nagar',
      availability: {
        weekdays: ['Evening'],
        weekends: ['Morning'],
        status: 'Available',
      },
      ageGroup: 'adult',
    };

    const result = calculateMatchScore(perfectMember, request);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.explanation).toContain('✓ Programming skill (+50%)');
    expect(result.explanation).toContain('✓ Same community: Anna Nagar (+20%)');
  });

  test('Partial match without matching skill receives only availability & community points', () => {
    const nonSkillMember = {
      skills: ['Elderly Support'],
      city: 'Chennai',
      community: 'Anna Nagar',
      availability: {
        weekdays: ['Evening'],
        status: 'Available',
      },
      ageGroup: 'adult',
    };

    const result = calculateMatchScore(nonSkillMember, request);
    expect(result.score).toBeLessThan(70);
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  test('Unavailable member receives 0 availability points', () => {
    const busyMember = {
      skills: ['Programming'],
      city: 'Chennai',
      community: 'Anna Nagar',
      availability: {
        status: 'Unavailable',
      },
      ageGroup: 'adult',
    };

    const result = calculateMatchScore(busyMember, request);
    expect(result.explanation).toContain('Currently unavailable (+0%)');
  });
});

describe('User Model Age Group Categorization', () => {
  test('Assigns correct age groups based on age', () => {
    const teen = new User({ age: 15, fullName: 'T', email: 't@t.com', firebaseUid: 'f1' });
    teen.validateSync();
    expect(teen.ageGroup).toBe('teenager');

    const young = new User({ age: 21, fullName: 'Y', email: 'y@y.com', firebaseUid: 'f2' });
    young.validateSync();
    expect(young.ageGroup).toBe('young_adult');

    const adult = new User({ age: 40, fullName: 'A', email: 'a@a.com', firebaseUid: 'f3' });
    adult.validateSync();
    expect(adult.ageGroup).toBe('adult');

    const senior = new User({ age: 67, fullName: 'S', email: 's@s.com', firebaseUid: 'f4' });
    senior.validateSync();
    expect(senior.ageGroup).toBe('senior');
  });
});
