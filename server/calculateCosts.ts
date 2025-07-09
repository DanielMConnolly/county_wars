/**
 * Utility functions for calculating franchise and distribution center placement costs
 */

/**
 * Calculate franchise placement cost based on population
 * @param population - Population of the area
 * @returns Franchise placement cost in dollars
 */
export const calculateFranchiseCost = (population: number): number => {
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
 * Calculate distribution center placement cost
 * @param existingDistributionCenters - Number of distribution centers the user already has
 * @returns Distribution center placement cost in dollars
 */
export const getDistributionCost = (existingDistributionCenters: number): number => {
  // First distribution center is free, subsequent ones cost $10,000
  return existingDistributionCenters === 0 ? 0 : 10000;
};
