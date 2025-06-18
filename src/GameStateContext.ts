
import { createContext, useContext } from 'react';
import { County, GameState } from './types/GameTypes';
import React from 'react';

// Define the context type
export interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // Helper functions
  addCounty: (_countyName: string) => void;
  removeCounty: (_countyId: string) => void;
  selectCounty: (_countyName: County)=> void;
  setMapStyle: (_style: string) => void;
  setHighlightColor: (_color: string) => void;
  resetGame: () => void;
  // Time management functions
  pauseTime: () => void;
  resumeTime: () => void;
  setGameDuration: (_hours: number) => void;
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
