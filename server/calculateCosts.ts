/**
 * Utility functions for calculating franchise placement costs
 */

/**
 * Calculate franchise placement cost based on population
 * @param population - Population of the area
 * @returns Franchise placement cost in dollars
 */
export const calculateFranchiseCost = (population: number): number => {
  // Linear scaling: 0 population = $0, 250,000 population = $10,000
  const maxPopulation = 250000;
  const maxCost = 10000;
  
  // Ensure population is not negative
  const validPopulation = Math.max(0, population);
  
  // Calculate cost as linear proportion of population
  const cost = Math.min((validPopulation / maxPopulation) * maxCost, maxCost);
  
  return Math.round(cost);
};
