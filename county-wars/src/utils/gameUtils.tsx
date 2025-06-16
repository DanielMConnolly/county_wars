import { useContext } from "react";
import { GameStateContext } from "../GameStateContext";
import { County } from "../types/GameTypes";

type DifficultyType  = 'Easy' | 'Medium' | 'Hard';

export const getCost = (difficulty: DifficultyType) => {
    const costs = {Easy: 100, Medium: 250, Hard: 500 };
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


  export const useIsCountyOwned = (county: County | null) => {
    if (!county) return false;
    const {gameState} = useContext(GameStateContext);
    const {ownedCounties} = gameState;
    const countycode = county.name + county.state;
    return ownedCounties.has(countycode);
  }
