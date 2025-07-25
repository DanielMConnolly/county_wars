import { createContext, useContext } from 'react';
import { GameState, PlacementMode, PlacedLocation } from './types/GameTypes';
import React from 'react';

// Define the context type
export interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // Helper functions
  selectLocation: (_franchise: PlacedLocation | null) => void;
  setMapStyle: (_style: string) => void;
  resetGame: () => void;
  assignUserColors: (_color: string) => void;
  getUserSelectedColor: () => string;
  // Location tracking
  setClickedLocation: (_location: { lat: number; lng: number } | null) => void;
  // State selection for explore mode
  selectState: (_stateName: string | null) => void;
  // Franchise management
  placeFranchise: (_name: string) => void;
  // Placement mode management
  placementMode: PlacementMode;
  onPlacementModeChange: (_mode: PlacementMode) => void;
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
