import { COUNTY_COSTS } from '../constants/GAMEDEFAULTS';

export type CountyDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Calculate county difficulty based on population or other factors
// For now, using a simple hash-based approach for consistency
export function calculateCountyDifficulty(countyName: string): CountyDifficulty {
  // Use a simple hash of the county name for consistent difficulty
  let hash = 0;
  for (let i = 0; i < countyName.length; i++) {
    const char = countyName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const absHash = Math.abs(hash);
  const remainder = absHash % 3;
  
  switch (remainder) {
    case 0:
      return 'EASY';
    case 1:
      return 'MEDIUM';
    case 2:
      return 'HARD';
    default:
      return 'MEDIUM';
  }
}

// Get the cost to conquer a county based on its difficulty
export function getCountyCost(countyName: string): number {
  const difficulty = calculateCountyDifficulty(countyName);
  return COUNTY_COSTS[difficulty];
}

// Get difficulty display name
export function getDifficultyDisplayName(difficulty: CountyDifficulty): string {
  switch (difficulty) {
    case 'EASY':
      return 'Easy';
    case 'MEDIUM':
      return 'Medium';
    case 'HARD':
      return 'Hard';
    default:
      return 'Medium';
  }
}

// Get difficulty color for UI
export function getDifficultyColor(difficulty: CountyDifficulty): string {
  switch (difficulty) {
    case 'EASY':
      return 'text-green-400';
    case 'MEDIUM':
      return 'text-yellow-400';
    case 'HARD':
      return 'text-red-400';
    default:
      return 'text-yellow-400';
  }
}

export function calculateDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert state FIPS code to state name
export function getStateName(stateFP: string): string {
  const stateMap: { [key: string]: string } = {
    '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
    '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
    '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
    '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
    '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
    '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
    '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
    '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
    '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
    '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
    '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
  };
  
  return stateMap[stateFP] || 'Unknown';
}