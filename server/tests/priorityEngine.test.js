const { calculatePriority } = require('../services/priorityEngine');

describe('priorityEngine.calculatePriority', () => {
  test('Emergency Transport with HIGH urgency scores HIGH', () => {
    const result = calculatePriority({
      category: 'Emergency Transport',
      requesterUrgency: 'HIGH',
      description: 'Need urgent transport, ambulance delayed',
    });
    expect(result.priority).toBe('HIGH');
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  test('Routine Grocery Pickup with LOW urgency scores LOW', () => {
    const result = calculatePriority({
      category: 'Grocery Pickup',
      requesterUrgency: 'LOW',
      description: 'Weekly shopping list, no rush',
    });
    expect(result.priority).toBe('LOW');
  });

  test('Tutoring requests default to LOW priority', () => {
    const result = calculatePriority({
      category: 'Tutoring',
      requesterUrgency: 'LOW',
      description: 'Help with algebra homework',
    });
    expect(result.priority).toBe('LOW');
  });

  test('urgent keywords raise the score even for a normally low category', () => {
    const withoutKeywords = calculatePriority({
      category: 'Grocery Pickup', requesterUrgency: 'LOW', description: 'need groceries',
    });
    const withKeywords = calculatePriority({
      category: 'Grocery Pickup', requesterUrgency: 'LOW', description: 'emergency, need groceries urgently asap',
    });
    expect(withKeywords.score).toBeGreaterThan(withoutKeywords.score);
  });

  test('long waiting time increases score', () => {
    const fresh = calculatePriority({
      category: 'Tutoring', requesterUrgency: 'LOW', description: 'help', createdAt: new Date(),
    });
    const stale = calculatePriority({
      category: 'Tutoring', requesterUrgency: 'LOW', description: 'help',
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
    });
    expect(stale.score).toBeGreaterThan(fresh.score);
  });
});
