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