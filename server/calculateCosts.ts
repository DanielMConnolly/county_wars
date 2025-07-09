/**
 * Utility functions for calculating franchise and distribution center placement costs
 */

import { getPopulationAroundPoint } from "./populationUtils";

/**
 * Calculate franchise placement cost based on population
 * @param population - Population of the area
 * @returns Franchise placement cost in dollars
 */
export const getPopulationCost = (population: number): number => {
  // Linear scaling: 0 population = $100, 250,000 population = $10,000
  const maxPopulation = 250000;
  const maxCost = 10000;
  const minCost = 100;

  // Ensure population is not negative
  const validPopulation = Math.max(0, population);

  // Calculate cost as linear proportion of population
  const cost = Math.min((validPopulation / maxPopulation) * maxCost, maxCost);

  // Ensure minimum cost of $100
  return Math.round(Math.max(cost, minCost));
};

/**
 * Get population data around a point using local population database and calculate franchise cost
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with population and franchise placement cost (cost can be null if error occurs)
 */
export const getFranchiseCost = async (
  lat: number,
  lng: number
): Promise<{ population: number | null; cost: number | null }> => {
  try {
    const population = await getPopulationAroundPoint(lat, lng);
    const cost = population !== null ? getPopulationCost(population) : null;
    return { population, cost };
  } catch (_error) {
    return { population: null, cost: null };
  }
};

/**
 * Calculate distribution center placement cost
 * @param existingDistributionCenters - Number of distribution centers the user already has
 * @returns Distribution center placement cost in dollars
 */
export const getDistributionCost = (existingDistributionCenters: number): number => {
  // First distribution center is free, subsequent ones cost $10,000
  return existingDistributionCenters === 0 ? 0 : 10000;
};
