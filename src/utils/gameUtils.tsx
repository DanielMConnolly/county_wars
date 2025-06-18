import { useContext } from "react";
import { GameStateContext } from "../GameStateContext";
import { County } from "../types/GameTypes";

type DifficultyType = 'Easy' | 'Medium' | 'Hard';

export const getCost = (difficulty: DifficultyType) => {
  const costs = { Easy: 100, Medium: 250, Hard: 500 };
  return costs[difficulty] || 100;
};

export const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'text-green-400';
    case 'Medium': return 'text-yellow-400';
    case 'Hard': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export const calculateDifficultyScoreBasedOnPopulation = (population: number): number => {
  // Calculate difficulty score with smoothing
  // Use logarithmic scale to prevent small populations from having too low scores
  const maxPop = 2000000;
  const minScore = 1; // Minimum difficulty score to prevent too easy counties

  // Apply square root for smoothing - gives more reasonable scores for smaller populations
  const normalizedScore = Math.sqrt(population / maxPop) * 100;
  return Math.round(Math.max(minScore, Math.min(100, normalizedScore)));
}

export const getDifficultyLevel = (score: number): 'Easy' | 'Medium' | 'Hard' => {
  if (score <= 33) return 'Easy';
  if (score <= 66) return 'Medium';
  return 'Hard';
};


export const useIsCountyOwned = (county: County | null) => {
  const { gameState } = useContext(GameStateContext);
  if (!county) return false;
  const { ownedCounties } = gameState;
  const countycode = county.stateFP + county.countyFP;
  return ownedCounties.has(countycode);
}
