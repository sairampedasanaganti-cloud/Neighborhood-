/**
 * PRIORITY ENGINE
 * ----------------
 * Computes an explainable priority score (0-100) for a HelpRequest instead of
 * trusting the requester's self-selected urgency at face value. Every point
 * added is logged in `explanation` so the score can be shown/justified in the UI
 * and explained by students during evaluation — no black-box ML involved.
 *
 * Score bands:
 *   >= 65  -> HIGH
 *   35-64  -> MEDIUM
 *   < 35   -> LOW
 */

const URGENT_KEYWORDS = [
  'emergency', 'urgent', 'asap', 'immediately', 'critical', 'severe',
  'chest pain', 'bleeding', 'ambulance', 'hospital', 'fainted', 'accident',
];

const CATEGORY_BASE_SCORE = {
  'Emergency Transport': 55,
  'Medicine Pickup': 30,
  'Grocery Pickup': 10,
  Tutoring: 5,
  'Other Community Help': 10,
};

const URGENCY_BONUS = { HIGH: 25, MEDIUM: 10, LOW: 0 };

function scoreToPriority(score) {
  if (score >= 65) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

/**
 * @param {Object} params
 * @param {string} params.category
 * @param {string} params.requesterUrgency - 'LOW' | 'MEDIUM' | 'HIGH'
 * @param {string} params.description
 * @param {Date}   [params.createdAt] - if recalculating for an existing (unaccepted) request
 * @returns {{ score:number, priority:string, explanation:string[] }}
 */
function calculatePriority({ category, requesterUrgency, description, createdAt }) {
  let score = 0;
  const explanation = [];

  const base = CATEGORY_BASE_SCORE[category] ?? 10;
  score += base;
  explanation.push(`Base score for category "${category}": +${base}`);

  const urgencyBonus = URGENCY_BONUS[requesterUrgency] ?? 0;
  if (urgencyBonus > 0) {
    score += urgencyBonus;
    explanation.push(`Requester-selected urgency "${requesterUrgency}": +${urgencyBonus}`);
  }

  const text = (description || '').toLowerCase();
  const matchedKeywords = URGENT_KEYWORDS.filter((kw) => text.includes(kw));
  if (matchedKeywords.length > 0) {
    const bonus = Math.min(20, matchedKeywords.length * 10);
    score += bonus;
    explanation.push(`Urgent keywords detected (${matchedKeywords.join(', ')}): +${bonus}`);
  }

  if (createdAt) {
    const waitingMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (waitingMinutes >= 60) {
      score += 20;
      explanation.push(`Unaccepted for over 60 minutes: +20`);
    } else if (waitingMinutes >= 20) {
      score += 10;
      explanation.push(`Unaccepted for over 20 minutes: +10`);
    }
  }

  score = Math.max(0, Math.min(100, score));
  const priority = scoreToPriority(score);
  explanation.push(`Final score ${score}/100 => Priority: ${priority}`);

  return { score, priority, explanation };
}

module.exports = { calculatePriority, scoreToPriority };
