/**
 * Utility functions for getting metro area information from coordinates
 */

interface CachedGeoData {
  metroArea: string | null;
  state: string;
  county: string;
}

interface CacheEntry {
  data: CachedGeoData;
  timestamp: number;
}

const geoDataCache = new Map<string, CacheEntry>();
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const COORDINATE_PRECISION = 3; // Round to ~100m precision

/**
 * Generate cache key from coordinates with rounding for nearby points
 */
const generateCacheKey = (lat: number, lng: number): string => {
  const roundedLat = Math.round(lat * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION);
  const roundedLng = Math.round(lng * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION);
  return `${roundedLat},${roundedLng}`;
};

/**
 * Check if cache entry is still valid
 */
const isCacheEntryValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_EXPIRY_MS;
};



/**
 * Get cached or fresh geo data from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with metro area name and state, or null if not found
 */
export const getCachedGeoDataFromCoordinates = async (lat: number, lng: number): Promise<CachedGeoData | null> => {
  const cacheKey = generateCacheKey(lat, lng);
  
  // Check cache first
  const cachedEntry = geoDataCache.get(cacheKey);
  if (cachedEntry && isCacheEntryValid(cachedEntry)) {
    return cachedEntry.data;
  }

  // Cache miss - fetch fresh data
  const freshData = await getGeoDataFromCoordinates(lat, lng);
  if (freshData) {
    // Cache the result
    geoDataCache.set(cacheKey, {
      data: freshData,
      timestamp: Date.now()
    });
    return freshData;
  }

  return null;
};

/**
 * Get population data around a point using Overpass API and calculate franchise cost
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with population and franchise placement cost
 */
export const getPopulationCost = async (lat: number, lng: number): Promise<{ population: number; cost: number }> => {
  try {
    // Overpass API query to get population data around the point
    // Search for places with population data within ~10km radius
    const overpassQuery = `
      [out:json][timeout:25];
      (
        relation["place"~"^(city|town|village|hamlet)$"]["population"](around:10000,${lat},${lng});
        way["place"~"^(city|town|village|hamlet)$"]["population"](around:10000,${lat},${lng});
        node["place"~"^(city|town|village|hamlet)$"]["population"](around:10000,${lat},${lng});
      );
      out tags;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Find the largest population value from nearby places
    let maxPopulation = 0;
    if (data.elements && data.elements.length > 0) {
      for (const element of data.elements) {
        if (element.tags && element.tags.population) {
          const pop = parseInt(element.tags.population, 10);
          if (!isNaN(pop) && pop > maxPopulation) {
            maxPopulation = pop;
          }
        }
      }
    }

    // If no population data found, use a default
    const population = maxPopulation > 0 ? maxPopulation : 10000;
    
    // Calculate cost based on population
    const cost = Math.max(10000, Math.floor(population * 0.1));

    return { population, cost };
  } catch (error) {
    console.error('Error fetching population data:', error);
    // Fallback to default values
    const population = 10000;
    const cost = Math.max(10000, Math.floor(population * 0.1));
    return { population, cost };
  }
};

/**
 * Get metro area name and state from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with metro area name and state, or null if not found
 */
export const getGeoDataFromCoordinates
  = async (lat: number, lng: number): Promise<{ metroArea: string | null; state: string, county: string } | null> => {
    const baseUrl =
      "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
    const params = new URLSearchParams({
      x: lng.toString(),
      y: lat.toString(),
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      format: "json",
    });

    const url = `${baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(url);

      const geoData = (await response.json()).result.geographies;


      let metroArea = null;
      if("Urban Areas" in geoData){
        metroArea = geoData["Urban Areas"][0].NAME.split(",")[0].trim();
      }



      const state = geoData["States"]?.[0].NAME;
      const county = geoData["Counties"]?.[0].NAME;

      return { metroArea, state, county };
    } catch (error) {
      console.error("Error fetching metro area:", error);
      return null;
    }
  };
