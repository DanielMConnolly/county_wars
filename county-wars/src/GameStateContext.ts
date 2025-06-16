
import { createContext, useContext } from 'react';
import { County, GameState } from './types/GameTypes';

// Define the context type
export interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // Helper functions
  addCounty: (county: County) => void;
  removeCounty: (countyId: string) => void;
  updateResources: (amount: number) => void;
  selectCounty: (countyName: County)=> void;
  setMapStyle: (style: string) => void;
  setHighlightColor: (color: string) => void;
  resetGame: () => void;
}

// Create the context
//@ts-expect-error This is only null if provider isn't used
export const GameStateContext = createContext<GameStateContextType>(null);

// Custom hook to use the GameState context
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
