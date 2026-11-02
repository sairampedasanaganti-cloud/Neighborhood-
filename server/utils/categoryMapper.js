/**
 * Offer Help Category Definitions and Request Mapper
 * Categorizes community requests based on the type of help required.
 */

const OFFER_HELP_CATEGORIES = [
  {
    id: 'medical_health',
    name: 'Medical & Health',
    icon: '🏥',
    description: 'Help with doctor visits, medical tests, medicines, and health-related needs.',
  },
  {
    id: 'education_academic',
    name: 'Education & Academic',
    icon: '🎓',
    description: 'Subject tutoring, exam preparation, academic support, and project guidance.',
  },
  {
    id: 'technology_digital',
    name: 'Technology & Digital',
    icon: '💻',
    description: 'Programming help, technical problem solving, phone assistance, and digital tools.',
  },
  {
    id: 'elderly_support',
    name: 'Elderly Support',
    icon: '👴',
    description: 'Assisting senior neighbors, checking in on elderly parents, and senior care support.',
  },
  {
    id: 'household_assistance',
    name: 'Household Assistance',
    icon: '🏠',
    description: 'Minor home repairs, heavy lifting, maintenance, and household support.',
  },
  {
    id: 'transportation_travel',
    name: 'Transportation & Travel',
    icon: '🚗',
    description: 'Travel help, booking rides, medical transportation, and transit assistance.',
  },
  {
    id: 'career_professional',
    name: 'Career & Professional',
    icon: '💼',
    description: 'Career guidance, resume & application reviews, and professional skill development.',
  },
  {
    id: 'companionship',
    name: 'Companionship',
    icon: '🧑🤝🧑',
    description: 'Walk together, study together, exercise, coffee or meals, and friendly hobbies.',
  },
  {
    id: 'daily_assistance',
    name: 'Daily Assistance',
    icon: '🛒',
    description: 'Grocery pickup, shopping errands, banking, utility paperwork, and daily tasks.',
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    description: 'General community assistance and requests that do not match another category.',
  },
];

/**
 * Maps any community request (by category, type, title, description) to one of the 10 Offer Help category IDs.
 * @param {object} request
 * @returns {string} Category ID ('medical_health', 'education_academic', etc.)
 */
function mapToOfferHelpCategory(request) {
  if (!request) return 'other';

  // If already mapped or explicitly stored as one of the 10 IDs or Names
  if (request.helpCategory) {
    const existing = OFFER_HELP_CATEGORIES.find(
      (c) => c.id === request.helpCategory || c.name.toLowerCase() === String(request.helpCategory).toLowerCase()
    );
    if (existing) return existing.id;
  }

  const category = (request.category || '').trim();
  const catLower = category.toLowerCase();
  const titleLower = (request.title || '').toLowerCase();
  const descLower = (request.description || '').toLowerCase();
  const reqType = (request.type || '').toLowerCase();

  // 1. Medical & Health
  const medicalExact = [
    'doctor visit',
    'medical test',
    'medicine',
    'medical appointment assistance',
    'illness & recovery support',
    'medical transportation',
    'medicine pickup',
    'emergency help',
    'go to doctor',
  ];
  if (medicalExact.includes(catLower)) {
    return 'medical_health';
  }
  if (
    catLower.includes('doctor') ||
    catLower.includes('medical') ||
    catLower.includes('medicine') ||
    catLower.includes('health') ||
    catLower.includes('clinic') ||
    catLower.includes('pharmacy')
  ) {
    return 'medical_health';
  }

  // 2. Education & Academic
  const educationExact = [
    'subject tutoring',
    'exam preparation',
    'academic support',
    'project guidance',
    'tutoring',
  ];
  if (educationExact.includes(catLower)) {
    return 'education_academic';
  }
  if (
    catLower.includes('tutoring') ||
    catLower.includes('academic') ||
    catLower.includes('exam prep') ||
    catLower.includes('study guidance')
  ) {
    return 'education_academic';
  }

  // 3. Technology & Digital
  const techExact = [
    'programming help',
    'technical help',
    'phone help',
    'digital service help',
    'tech support',
    'programming',
    'technology',
  ];
  if (techExact.includes(catLower)) {
    return 'technology_digital';
  }
  if (
    catLower.includes('programming') ||
    catLower.includes('technical') ||
    catLower.includes('phone help') ||
    catLower.includes('digital') ||
    catLower.includes('software') ||
    catLower.includes('tech support')
  ) {
    return 'technology_digital';
  }

  // 4. Elderly Support
  const elderlyExact = [
    'elderly parent support',
    'senior assistance',
    'elderly care',
    'senior support',
  ];
  if (elderlyExact.includes(catLower)) {
    return 'elderly_support';
  }
  if (
    catLower.includes('elderly') ||
    catLower.includes('senior assistance') ||
    catLower.includes('senior care') ||
    catLower.includes('aging parent')
  ) {
    return 'elderly_support';
  }

  // 5. Household Assistance
  const householdExact = [
    'household assistance',
    'home help',
    'childcare support',
    'pet care',
  ];
  if (householdExact.includes(catLower)) {
    return 'household_assistance';
  }
  if (
    catLower.includes('household') ||
    catLower.includes('home help') ||
    catLower.includes('repair') ||
    catLower.includes('childcare') ||
    catLower.includes('pet care')
  ) {
    return 'household_assistance';
  }

  // 6. Transportation & Travel
  const travelExact = [
    'travel help',
    'medical transportation',
    'driving/transport',
    'transport',
  ];
  if (travelExact.includes(catLower)) {
    return 'transportation_travel';
  }
  if (
    catLower.includes('travel') ||
    catLower.includes('transport') ||
    catLower.includes('driving') ||
    catLower.includes('ride')
  ) {
    return 'transportation_travel';
  }

  // 7. Career & Professional
  const careerExact = [
    'career guidance',
    'resume & application help',
    'skill development',
    'resume help',
  ];
  if (careerExact.includes(catLower)) {
    return 'career_professional';
  }
  if (
    catLower.includes('career') ||
    catLower.includes('resume') ||
    catLower.includes('application help') ||
    catLower.includes('skill development') ||
    catLower.includes('interview') ||
    catLower.includes('upskilling')
  ) {
    return 'career_professional';
  }

  // 8. Companionship
  const companionshipExact = [
    'walk together',
    'study together',
    'exercise together',
    'coffee or meals',
    'hobbies together',
    'play sports',
    'go for walks',
    'work on projects',
    'practice hobbies',
    'attend events',
    'go shopping',
    'pursue hobbies',
    'explore nearby places',
    'walk after work',
    'exercise & sports',
    'shop together',
    'weekend activities',
    'local trips',
    'talk together',
    'play games',
    'go outside',
    'community events',
    'spend time together',
  ];
  if (reqType === 'companionship' || companionshipExact.includes(catLower)) {
    return 'companionship';
  }

  // 9. Daily Assistance
  const dailyExact = [
    'shopping help',
    'important errands',
    'banking',
    'government work',
    'documents',
    'grocery pickup',
    'errands',
  ];
  if (dailyExact.includes(catLower)) {
    return 'daily_assistance';
  }
  if (
    catLower.includes('shopping') ||
    catLower.includes('grocery') ||
    catLower.includes('banking') ||
    catLower.includes('errand') ||
    catLower.includes('government work') ||
    catLower.includes('documents')
  ) {
    return 'daily_assistance';
  }

  // Fallback checks on title/description if category was generic (e.g. "Other")
  if (titleLower.includes('medicine') || titleLower.includes('doctor') || titleLower.includes('fever') || titleLower.includes('hospital')) {
    return 'medical_health';
  }
  if (titleLower.includes('tutoring') || titleLower.includes('math') || titleLower.includes('exam') || titleLower.includes('physics')) {
    return 'education_academic';
  }
  if (titleLower.includes('python') || titleLower.includes('laptop') || titleLower.includes('code') || titleLower.includes('programming') || titleLower.includes('wifi') || titleLower.includes('phone')) {
    return 'technology_digital';
  }
  if (titleLower.includes('senior') || titleLower.includes('elderly')) {
    return 'elderly_support';
  }
  if (titleLower.includes('repair') || titleLower.includes('cleaning') || titleLower.includes('household') || titleLower.includes('plumber')) {
    return 'household_assistance';
  }
  if (titleLower.includes('ride') || titleLower.includes('travel') || titleLower.includes('transport') || titleLower.includes('cab')) {
    return 'transportation_travel';
  }
  if (titleLower.includes('resume') || titleLower.includes('job') || titleLower.includes('career') || titleLower.includes('interview')) {
    return 'career_professional';
  }
  if (titleLower.includes('companion') || titleLower.includes('stroll') || titleLower.includes('walk together') || titleLower.includes('chat')) {
    return 'companionship';
  }
  if (titleLower.includes('grocery') || titleLower.includes('milk') || titleLower.includes('vegetable') || titleLower.includes('errand')) {
    return 'daily_assistance';
  }

  return 'other';
}

function getOfferHelpCategoryById(id) {
  return OFFER_HELP_CATEGORIES.find((c) => c.id === id) || OFFER_HELP_CATEGORIES[OFFER_HELP_CATEGORIES.length - 1];
}

module.exports = {
  OFFER_HELP_CATEGORIES,
  mapToOfferHelpCategory,
  getOfferHelpCategoryById,
};
