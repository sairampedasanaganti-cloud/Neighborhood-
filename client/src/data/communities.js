/**
 * Predefined geographic, category, and age-group data for NeighborLink.
 * Matches the Final NeighborLink specification precisely.
 */

export const CITIES_AND_COMMUNITIES = {
  Chennai: [
    'Anna Nagar',
    'T. Nagar',
    'Adyar',
    'Velachery',
    'Besant Nagar',
    'Mylapore',
    'Thiruvanmiyur',
    'Kilpauk',
    'Nungambakkam',
    'Guindy',
    'Porur',
    'Tambaram',
    'Other',
  ],
  Vellore: [
    'VIT Campus',
    'Katpadi',
    'Gandhi Nagar',
    'Sathuvachari',
    'Bagayam',
    'Thorapadi',
    'Kosapet',
    'Other',
  ],
  Bengaluru: [
    'Indiranagar',
    'Koramangala',
    'HSR Layout',
    'Whitefield',
    'Jayanagar',
    'Malleshwaram',
    'JP Nagar',
    'BTM Layout',
    'Electronic City',
    'Other',
  ],
  Hyderabad: [
    'Banjara Hills',
    'Jubilee Hills',
    'Gachibowli',
    'Madhapur',
    'Kondapur',
    'Hitec City',
    'Kukatpally',
    'Other',
  ],
  Mumbai: [
    'Bandra',
    'Andheri',
    'Juhu',
    'Powai',
    'Colaba',
    'Dadar',
    'Thane',
    'Malad',
    'Other',
  ],
  Delhi: [
    'Hauz Khas',
    'Connaught Place',
    'Saket',
    'Vasant Kunj',
    'Dwarka',
    'Greater Kailash',
    'Rohini',
    'Other',
  ],
};

export const CITY_COORDINATES = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
};

export const COMMUNITY_COORDINATES = {
  // Chennai
  'Anna Nagar': { lat: 13.0850, lng: 80.2101 },
  'T. Nagar': { lat: 13.0418, lng: 80.2341 },
  'Adyar': { lat: 13.0012, lng: 80.2565 },
  'Velachery': { lat: 12.9759, lng: 80.2212 },
  'Besant Nagar': { lat: 13.0002, lng: 80.2668 },
  'Mylapore': { lat: 13.0368, lng: 80.2676 },
  'Thiruvanmiyur': { lat: 12.9830, lng: 80.2594 },
  'Kilpauk': { lat: 13.0784, lng: 80.2415 },
  'Nungambakkam': { lat: 13.0569, lng: 80.2425 },
  'Guindy': { lat: 13.0067, lng: 80.2026 },
  'Porur': { lat: 13.0382, lng: 80.1565 },
  'Tambaram': { lat: 12.9249, lng: 80.1000 },
  // Vellore (VIT region)
  'VIT Campus': { lat: 12.9692, lng: 79.1559 },
  'Katpadi': { lat: 12.9782, lng: 79.1378 },
  'Gandhi Nagar': { lat: 12.9610, lng: 79.1415 },
  'Sathuvachari': { lat: 12.9372, lng: 79.1672 },
  'Bagayam': { lat: 12.8710, lng: 79.1350 },
  'Thorapadi': { lat: 12.9028, lng: 79.1090 },
  'Kosapet': { lat: 12.9150, lng: 79.1320 },
  // Bengaluru
  'Indiranagar': { lat: 12.9784, lng: 77.6408 },
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'HSR Layout': { lat: 12.9121, lng: 77.6446 },
  'Whitefield': { lat: 12.9698, lng: 77.7499 },
  'Jayanagar': { lat: 12.9308, lng: 77.5838 },
  'Malleshwaram': { lat: 13.0031, lng: 77.5643 },
  'JP Nagar': { lat: 12.9063, lng: 77.5857 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },
  'Electronic City': { lat: 12.8452, lng: 77.6602 },
  // Hyderabad
  'Banjara Hills': { lat: 17.4156, lng: 78.4350 },
  'Jubilee Hills': { lat: 17.4319, lng: 78.4073 },
  'Gachibowli': { lat: 17.4401, lng: 78.3489 },
  'Madhapur': { lat: 17.4483, lng: 78.3915 },
  'Kondapur': { lat: 17.4646, lng: 78.3582 },
  'Hitec City': { lat: 17.4474, lng: 78.3762 },
  // Mumbai
  'Bandra': { lat: 19.0596, lng: 72.8295 },
  'Andheri': { lat: 19.1136, lng: 72.8697 },
  'Juhu': { lat: 19.1075, lng: 72.8263 },
  'Powai': { lat: 19.1197, lng: 72.9051 },
  'Colaba': { lat: 18.9067, lng: 72.8147 },
  // Delhi
  'Hauz Khas': { lat: 28.5494, lng: 77.2001 },
  'Connaught Place': { lat: 28.6315, lng: 77.2167 },
  'Saket': { lat: 28.5245, lng: 77.2066 },
  'Dwarka': { lat: 28.5921, lng: 77.0460 },
};

/**
 * Returns accurate coordinates for a given community and city.
 */
export function getCoordinatesForCommunity(community, city) {
  if (community && COMMUNITY_COORDINATES[community]) {
    return COMMUNITY_COORDINATES[community];
  }
  if (city && CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  return { lat: 13.0827, lng: 80.2707 }; // Default Chennai center
}

/**
 * Accurate reverse geocoding utility:
 * Uses Google Geocoding API if key is present, falls back to OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoords(lat, lng, googleApiKey = '') {
  let detectedCity = 'Chennai';
  let detectedCommunity = 'Anna Nagar';
  let fullAddress = '';

  // 1. Try Google Maps Geocoding if API key is provided
  if (googleApiKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.length > 0) {
        fullAddress = data.results[0].formatted_address;
        const comps = data.results[0].address_components;

        let sublocality = '';
        let locality = '';
        let adminArea2 = '';

        comps.forEach((c) => {
          if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) {
            sublocality = c.long_name;
          }
          if (c.types.includes('locality')) {
            locality = c.long_name;
          }
          if (c.types.includes('administrative_area_level_2')) {
            adminArea2 = c.long_name;
          }
        });

        detectedCommunity = sublocality || locality || detectedCommunity;
        detectedCity = locality || adminArea2 || detectedCity;

        return {
          city: detectedCity,
          community: detectedCommunity,
          address: fullAddress,
          lat,
          lng,
        };
      }
    } catch (e) {
      console.warn('[Geocoding] Google Geocoding error:', e.message);
    }
  }

  // 2. OpenStreetMap Nominatim Reverse Geocoding (free, reliable fallback)
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' },
    });
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      fullAddress = data.display_name;

      detectedCity = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || 'Chennai';
      detectedCommunity =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.residential ||
        addr.city_district ||
        addr.village ||
        addr.hamlet ||
        detectedCity;

      return {
        city: detectedCity,
        community: detectedCommunity,
        address: fullAddress,
        lat,
        lng,
      };
    }
  } catch (e) {
    console.warn('[Geocoding] Nominatim geocoding error:', e.message);
  }

  // 3. Fallback: closest predefined city and community
  return detectClosestCityAndCommunity(lat, lng);
}

export function detectClosestCityAndCommunity(lat, lng) {
  let closestCity = 'Chennai';
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const d = Math.hypot(coords.lat - lat, coords.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closestCity = city;
    }
  }

  const communities = CITIES_AND_COMMUNITIES[closestCity] || ['Other'];
  return {
    city: closestCity,
    community: communities[0],
    address: `${communities[0]}, ${closestCity}`,
    lat,
    lng,
  };
}

export const INTEREST_OPTIONS = [
  'Sports',
  'Fitness',
  'Music',
  'Reading',
  'Technology',
  'Art',
  'Gaming',
  'Travel',
  'Community',
  'Cooking',
  'Other',
];

export const SKILL_OPTIONS = [
  'Academic Support',
  'Programming',
  'Technology',
  'Elderly Support',
  'Household Assistance',
  'Pet Care',
  'Other',
];

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

// Age Group helper
export function getAgeGroup(age) {
  const num = Number(age);
  if (num >= 10 && num <= 17) return 'teenager';
  if (num >= 18 && num <= 25) return 'young_adult';
  if (num >= 26 && num <= 59) return 'adult';
  if (num >= 60) return 'senior';
  return 'adult';
}

export function formatAgeGroupLabel(group) {
  switch (group) {
    case 'teenager': return 'Teenager (10–17)';
    case 'young_adult': return 'Young Adult (18–25)';
    case 'adult': return 'Adult (26–59)';
    case 'senior': return 'Senior Citizen (60+)';
    default: return 'Community Member';
  }
}

// -----------------------------------------------------------------------------
// FINAL AGE-SPECIFIC HELP REQUEST CATEGORIES
// -----------------------------------------------------------------------------
export const HELP_CATEGORIES = {
  teenager: [
    { title: 'Subject Tutoring', icon: '📚', desc: 'Get help understanding a subject or academic topic.' },
    { title: 'Exam Preparation', icon: '📝', desc: 'Prepare for exams with guidance from another member.' },
    { title: 'Programming Help', icon: '💻', desc: 'Get help with coding or programming problems.' },
    { title: 'Project Guidance', icon: '🎓', desc: 'Get guidance for school or academic projects.' },
    { title: 'Career Guidance', icon: '🎯', desc: 'Get advice about future studies and career choices.' },
    { title: 'Skill Development', icon: '🛠️', desc: 'Get help learning a useful new skill.' },
    { title: 'Other', icon: '➕', desc: 'Describe something else you need help with.' },
  ],
  young_adult: [
    { title: 'Academic Support', icon: '🎓', desc: 'Higher studies coursework, concept clarification, or assignments.' },
    { title: 'Technical Help', icon: '💻', desc: 'Software development, tool setups, and technical problem solving.' },
    { title: 'Project Guidance', icon: '📂', desc: 'Engineering, capstone, or research project assistance.' },
    { title: 'Career Guidance', icon: '💼', desc: 'Industry insights, internship advice, and interview preparation.' },
    { title: 'Resume & Application Help', icon: '📄', desc: 'CV review, portfolio feedback, and application tips.' },
    { title: 'Skill Development', icon: '🛠️', desc: 'Professional upskilling, frameworks, and practical tools.' },
    { title: 'Other', icon: '➕', desc: 'Describe something else you need help with.' },
  ],
  adult: [
    { title: 'Elderly Parent Support', icon: '👴', desc: 'Checking in, visiting, or assisting aging parents nearby.' },
    { title: 'Childcare Support', icon: '👶', desc: 'Short-term neighborhood supervision or emergency school pickup.' },
    { title: 'Medical Appointment Assistance', icon: '🏥', desc: 'Accompaniment to local clinics or consultations.' },
    { title: 'Illness & Recovery Support', icon: '🩺', desc: 'Home assistance, recovery check-in, or meal support.' },
    { title: 'Important Errands', icon: '📋', desc: 'Urgent documentation, paperwork, or postal errands.' },
    { title: 'Household Assistance', icon: '🏠', desc: 'Minor home repairs, heavy item moving, or tool sharing.' },
    { title: 'Digital Service Help', icon: '📱', desc: 'Online billing, government portals, or device troubleshooting.' },
    { title: 'Other', icon: '➕', desc: 'Describe something else you need help with.' },
  ],
  senior: [
    { title: 'Medicine', icon: '💊', desc: 'Pick up medicines from local pharmacy with prescription.' },
    { title: 'Doctor Visit', icon: '🏥', desc: 'Accompany to medical clinic, checkup, or hospital visit.' },
    { title: 'Medical Test', icon: '🧪', desc: 'Assistance visiting diagnostic lab or sample collection.' },
    { title: 'Banking', icon: '🏦', desc: 'Passbook updating, pension verification, or ATM assistance.' },
    { title: 'Government Work', icon: '🏛️', desc: 'Ration office, utility bill desk, or municipal paperwork.' },
    { title: 'Phone Help', icon: '📱', desc: 'Smartphone usage, WhatsApp, video calling family, or recharge.' },
    { title: 'Travel Help', icon: '🚕', desc: 'Booking auto/cab or assistance boarding transportation.' },
    { title: 'Shopping Help', icon: '🛒', desc: 'Milk, vegetables, groceries, or household supplies.' },
    { title: 'Home Help', icon: '🏠', desc: 'Changing high bulb, reaching upper shelves, or minor home task.' },
    { title: 'Documents', icon: '📄', desc: 'Reading small print, photocopy assistance, or filing papers.' },
    { title: 'Other', icon: '➕', desc: 'Describe something else you need help with.' },
  ],
};

// -----------------------------------------------------------------------------
// FINAL AGE-SPECIFIC COMPANIONSHIP (COMPANY) CATEGORIES
// -----------------------------------------------------------------------------
export const COMPANIONSHIP_CATEGORIES = {
  teenager: [
    { title: 'Study Together', icon: '📚', desc: 'Focus and revise together with a neighborhood peer.' },
    { title: 'Play Sports', icon: '⚽', desc: 'Play badminton, football, cricket, or games together.' },
    { title: 'Go for Walks', icon: '🚶', desc: 'Friendly walk in the neighborhood or nearby park.' },
    { title: 'Work on Projects', icon: '💻', desc: 'Collaborate on coding, experiments, or school projects.' },
    { title: 'Practice Hobbies', icon: '🎸', desc: 'Practice music, art, gaming, or crafts together.' },
    { title: 'Attend Events', icon: '🎉', desc: 'Attend neighborhood festivals or school events together.' },
    { title: 'Other', icon: '➕', desc: 'Propose a friendly youth activity together.' },
  ],
  young_adult: [
    { title: 'Study Together', icon: '📚', desc: 'Library or study group sessions for competitive exams.' },
    { title: 'Exercise Together', icon: '🏃', desc: 'Workout partner for gym, running, or outdoor fitness.' },
    { title: 'Go for Walks', icon: '🚶', desc: 'Relaxing evening or weekend walk around the block.' },
    { title: 'Go Shopping', icon: '🛒', desc: 'Browse local stores, bookstores, or supermarkets together.' },
    { title: 'Attend Events', icon: '🎉', desc: 'Concerts, hackathons, meetups, or local exhibitions.' },
    { title: 'Pursue Hobbies', icon: '🎨', desc: 'Music jams, digital art, photography, or board gaming.' },
    { title: 'Explore Nearby Places', icon: '🌆', desc: 'Discover neighborhood cafes, viewpoints, or historical spots.' },
    { title: 'Other', icon: '➕', desc: 'Plan an enjoyable community activity.' },
  ],
  adult: [
    { title: 'Walk After Work', icon: '🚶', desc: 'Refreshing post-work evening walk in the neighborhood.' },
    { title: 'Exercise & Sports', icon: '🏃', desc: 'Badminton, jogging, cycling, or tennis partner.' },
    { title: 'Shop Together', icon: '🛒', desc: 'Weekend market, grocery, or department store visits.' },
    { title: 'Coffee or Meals', icon: '☕', desc: 'Relaxed conversation over tea, coffee, or lunch.' },
    { title: 'Attend Events', icon: '🎉', desc: 'Community cultural programs, lectures, or resident meets.' },
    { title: 'Weekend Activities', icon: '🌅', desc: 'Gardening, outdoor activities, or neighborhood cleanups.' },
    { title: 'Local Trips', icon: '🌆', desc: 'Short weekend drives, heritage walks, or neighborhood outings.' },
    { title: 'Hobbies Together', icon: '🎨', desc: 'Reading discussions, cooking, crafting, or chess.' },
    { title: 'Other', icon: '➕', desc: 'Suggest a friendly community activity.' },
  ],
  senior: [
    { title: 'Walk Together', icon: '🚶', desc: 'Gentle walk in quiet colony roads or park.' },
    { title: 'Talk Together', icon: '💬', desc: 'Pleasant conversation and sharing stories over tea.' },
    { title: 'Shop Together', icon: '🛒', desc: 'Companionship while visiting local neighborhood shops.' },
    { title: 'Go to Doctor', icon: '🏥', desc: 'Friendly accompaniment so you never feel alone.' },
    { title: 'Play Games', icon: '🎲', desc: 'Carrom, cards, chess, or solving crosswords together.' },
    { title: 'Go Outside', icon: '🌳', desc: 'Sitting in park, garden, or veranda for fresh air.' },
    { title: 'Community Events', icon: '🎉', desc: 'Temple visits, cultural festivals, or colony gatherings.' },
    { title: 'Spend Time Together', icon: '🧑🤝🧑', desc: 'A warm afternoon visit for companionship.' },
    { title: 'Other', icon: '➕', desc: 'Suggest how you would like to spend meaningful time.' },
  ],
};
