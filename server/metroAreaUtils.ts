/**
 * Utility functions for getting metro area information from coordinates
 */

import { calculateFranchiseCost } from './calculateCosts';
import { calculatePopulationInRadius } from './populationUtils.js';
import { GAME_DEFAULTS } from '../src/constants/gameDefaults';

/**
 * Get population data around a point using local population database and calculate franchise cost
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with population and franchise placement cost (cost can be null if error occurs)
 */
export const getPopulationCost = async (
  lat: number,
  lng: number
): Promise<{ population: number | null; cost: number | null }> => {
  try {
    const radiusMeters = GAME_DEFAULTS.DEFAULT_RADIUS_METERS; // Use game default radius (5 miles)
    const population = await calculatePopulationInRadius(lat, lng, radiusMeters);
    const cost = calculateFranchiseCost(population);
    return { population, cost };
  } catch (_error) {

    return {population: null, cost: null };
  }
};

/**
 * Get metro area name and state from lat/lng using U.S. Census Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with metro area name and state, or null if not found
 */
export const getGeoDataFromCoordinates = async (
  lat: number,
  lng: number
): Promise<{ metroArea: string | null; state: string; county: string } | null> => {
  const baseUrl = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';
  const params = new URLSearchParams({
    x: lng.toString(),
    y: lat.toString(),
    benchmark: 'Public_AR_Current',
    vintage: 'Current_Current',
    format: 'json',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const geoData = (await response.json()).result.geographies;

    let metroArea = null;
    if ('Urban Areas' in geoData) {
      metroArea = geoData['Urban Areas'][0].NAME.split(',')[0].trim();
    }

    const state = geoData['States']?.[0].NAME;
    const county = geoData['Counties']?.[0].NAME;

    return { metroArea, state, county };
  } catch (error) {
    console.error('Error fetching metro area:', error);
    return null;
  }
};
