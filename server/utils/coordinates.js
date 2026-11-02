/**
 * Predefined geographic coordinates for cities and communities in NeighborLink.
 * Matches client data for seamless location resolution and fallback.
 */

const CITY_COORDINATES = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
};

const COMMUNITY_COORDINATES = {
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

function getCoordinatesForCommunity(community, city) {
  if (community && COMMUNITY_COORDINATES[community]) {
    return COMMUNITY_COORDINATES[community];
  }
  if (city && CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  return { lat: 13.0850, lng: 80.2101 };
}

module.exports = {
  CITY_COORDINATES,
  COMMUNITY_COORDINATES,
  getCoordinatesForCommunity,
};
