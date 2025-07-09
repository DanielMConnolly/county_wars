import { Franchise } from '../src/types/GameTypes';
import { dbOperations } from './database';

export const calculateIncomeForFranchise = (franchise: Franchise): number => {
  const population = franchise.population || 0;
  const maxPopulation = 250000;
  const maxIncome = 1000;

  // Calculate income as a linear proportion of population
  const income = Math.min((population / maxPopulation) * maxIncome, maxIncome);

  return Math.round(income);
};

export const calculateIncome = async (userId: string, gameId: string): Promise<number> => {
  try {
    // Get franchises owned by the user in the specific game
    const userFranchises = await dbOperations.getUserGameFranchises(userId, gameId);

    // Calculate total income from all user's franchises
    let totalIncome = 0;
    for (const franchise of userFranchises) {
      const franchiseIncome = calculateIncomeForFranchise(franchise);
      totalIncome += franchiseIncome;
    }

    return totalIncome;
  } catch (error) {
    console.error('Error calculating income for user:', error);
    return 0;
  }
};
