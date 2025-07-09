import { Franchise, PlacedLocation} from '../types/GameTypes';

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

/**
 * Validate if a franchise can be placed at the given location
 * @param lat Latitude of the location to check
 * @param lng Longitude of the location to check
 * @param userId User ID who wants to place the franchise
 * @param placementMode Current placement mode
 * @param existingLocations Array of all existing locations
 * @returns Validation result with success status and error message
 */
export function validateLocationPlacement(
  lat: number,
  lng: number,
  userId: string,
  existingFranchises: Franchise[],
  distributionCenters: PlacedLocation[]
): {
  isValid: boolean;
  errorMessage?: string;
  nearestLocation?: PlacedLocation | null;
  distance?: number;
} {

    // Check if too close to existing franchises (5-mile rule)
    for (const location of existingFranchises) {
      if (location.locationType === 'franchise') {
        const distance = calculateDistanceMiles(lat, lng, location.lat, location.long);
        if (distance < 5) {
          return {
            isValid: false,
            errorMessage: 'Too close to existing franchise',
            nearestLocation: location,
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
          };
        }
      }
    }


    if (distributionCenters.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Must build a distribution center first'
      };
    }

    let nearestDistributionCenter = null;
    let shortestDistance = Infinity;

    for (const distributionCenter of distributionCenters) {
      const distance = calculateDistanceMiles(lat, lng, distributionCenter.lat, distributionCenter.long);

      if (distance <= 500) {
        return { isValid: true };
      }

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestDistributionCenter = distributionCenter;
      }
    }

    return {
      isValid: false,
      errorMessage: 'Too far from distribution center',
      nearestLocation: nearestDistributionCenter,
      distance: Math.round(shortestDistance)
    };
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
