/**
 * Utility functions for calculating franchise placement costs
 */

/**
 * Calculate franchise placement cost based on population
 * @param population - Population of the area
 * @returns Franchise placement cost in dollars
 */
export const calculateFranchiseCost = (population: number): number => {
  // Calculate cost based on population (scale from $500 to $100,000)
  // Use tiered scaling for better distribution
  const minCost = 500;
  const maxCost = 100000;
  
  let cost: number;
  
  if (population <= 1000) {
    // Very small populations: $500-$2,000
    cost = 500 + (population / 1000) * 1500;
  } else if (population <= 10000) {
    // Small populations: $2,000-$8,000
    cost = 2000 + ((population - 1000) / 9000) * 6000;
  } else if (population <= 50000) {
    // Medium populations: $8,000-$25,000
    cost = 8000 + ((population - 10000) / 40000) * 17000;
  } else if (population <= 200000) {
    // Large populations: $25,000-$60,000
    cost = 25000 + ((population - 50000) / 150000) * 35000;
  } else {
    // Very large populations: $60,000-$100,000
    const excess = Math.min(population - 200000, 800000); // Cap at 1M total
    cost = 60000 + (excess / 800000) * 40000;
  }
  
  return Math.floor(Math.max(minCost, Math.min(cost, maxCost)));
};