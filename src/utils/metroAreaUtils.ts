/**
 * Utility functions for getting metro area information from coordinates
 */

interface CensusGeocodeResponse {
  result?: {
    geographies?: {
      'Core Based Statistical Areas'?: Array<{
        NAME: string;
        CBSA: string;
        LSAD: string;
      }>;
      'Metropolitan Statistical Areas'?: Array<{
        NAME: string;
        CBSA: string;
        LSAD: string;
      }>;
    };
  };
}

/**
 * Get metro area name from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude  
 * @returns Metro area name or fallback string
 */
export const getMetroAreaFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    // U.S. Census Geocoding API for Core Based Statistical Areas (CBSA)
    const url = `https://geocoding.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Census2020&vintage=Census2020_Census2020&layers=84&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Census API request failed: ${response.status}`);
    }
    
    const data: CensusGeocodeResponse = await response.json();
    
    // Try to get Metropolitan Statistical Area first (larger metro areas)
    const msa = data.result?.geographies?.['Metropolitan Statistical Areas']?.[0];
    if (msa?.NAME) {
      return msa.NAME;
    }
    
    // Fall back to Core Based Statistical Area (includes both metro and micro areas)
    const cbsa = data.result?.geographies?.['Core Based Statistical Areas']?.[0];
    if (cbsa?.NAME) {
      return cbsa.NAME;
    }
    
    return 'Rural Area';
    
  } catch (error) {
    console.error('Error fetching metro area:', error);
    return 'Unknown Metro Area';
  }
};

/**
 * Get metro area with caching for performance
 */
const metroAreaCache = new Map<string, string>();

export const getCachedMetroArea = async (lat: number, lng: number): Promise<string> => {
  // Create cache key with reduced precision for nearby points
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  
  if (metroAreaCache.has(cacheKey)) {
    return metroAreaCache.get(cacheKey)!;
  }
  
  const metroArea = await getMetroAreaFromCoordinates(lat, lng);
  metroAreaCache.set(cacheKey, metroArea);
  
  return metroArea;
};

/**
 * Check if coordinates are in a major metro area
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Boolean indicating if it's a major metro area
 */
export const isInMajorMetroArea = async (lat: number, lng: number): Promise<boolean> => {
  const metroArea = await getCachedMetroArea(lat, lng);
  
  // List of major metro areas (you can expand this)
  const majorMetros = [
    'New York-Newark-Jersey City',
    'Los Angeles-Long Beach-Anaheim', 
    'Chicago-Naperville-Elgin',
    'Dallas-Fort Worth-Arlington',
    'Houston-The Woodlands-Sugar Land',
    'Washington-Arlington-Alexandria',
    'Miami-Fort Lauderdale-West Palm Beach',
    'Philadelphia-Camden-Wilmington',
    'Atlanta-Sandy Springs-Roswell',
    'Boston-Cambridge-Newton'
  ];
  
  return majorMetros.some(major => metroArea.includes(major.split('-')[0]));
};