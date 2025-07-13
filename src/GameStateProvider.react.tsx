import React, { useState, ReactNode, useEffect } from 'react';
import { GameStateContext, GameStateContextType } from './GameStateContext';
import { GameState, PlacementMode, PlacedLocation } from './types/GameTypes';
import { connectToGameSocket, disconnectFromGameSocket } from './services/connectToGameSocket';
import { fetchClickedLocationData } from './api_calls/HTTPRequests';
import {
  fetchUserHighlightColor,
  updateUserHighlightColor,
  fetchUserGameMoney,
  placeLocation,
  fetchGameState,
} from './api_calls/HTTPRequests';
import { getDefaultState } from './utils/getDefaultState';
import { getCurrentGameId } from './utils/gameUrl';
import { useAuth } from './auth/AuthContext';
import { useToast } from './Toast/ToastContext';
import { getUserColorUnique } from './utils/colorUtils';

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(getDefaultState());
  const gameId = getCurrentGameId();
  const [placementMode, setPlacementMode] = useState<PlacementMode>('franchise');
  const { user } = useAuth();
  const [_, setIsConnected] = useState<boolean>(false);
  const { showToast } = useToast();

  const userId = user?.id;

  // Helper function to select a franchise
  const selectLocation = (location: PlacedLocation | null) => {
    setGameState(prevState => ({
      ...prevState,
      selectedLocation: location,
      clickedLocation: null,
    }));
  };

  // Helper function to set map style
  const setMapStyle = (style: string) => {
    setGameState(prevState => ({
      ...prevState,
      mapStyle: style,
    }));
  };

  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the game?')) {
      setGameState(getDefaultState());
    }
  };

  const setClickedLocation = (location: { lat: number; lng: number } | null) => {
    setGameState(prevState => ({
      ...prevState,
      clickedLocation: location,
      selectedLocation: null,
    }));
  };

  const selectState = (stateName: string | null) => {
    setGameState(prevState => ({
      ...prevState,
      selectedState: stateName,
      selectedLocation: null,
      clickedLocation: null,
    }));
  };

  const onPlacementModeChange = (mode: PlacementMode) => {
    setPlacementMode(mode);
    
    if (mode !== 'explore') {
      setGameState(prevState => ({
        ...prevState,
        selectedState: null,
      }));
    }
  };

  const assignUserColors = async (newHighlightColor: string) => {
    if (userId == null) return;
    await updateUserHighlightColor(userId, newHighlightColor);
    const newUserColors = new Map(gameState.userColors);
    let existingUserWithNewColor = null;
    gameState.userColors.forEach((color, user) => {
      if (user != userId && color === newHighlightColor) {
        existingUserWithNewColor = user;
      }
    });
    newUserColors.set(userId, newHighlightColor);
    if (existingUserWithNewColor) {
      const uniqueColor = getUserColorUnique(
        existingUserWithNewColor,
        new Set(gameState.userColors.values())
      );
      newUserColors.set(existingUserWithNewColor, uniqueColor);
    }

    setGameState(prevState => ({
      ...prevState,
      userColors: newUserColors,
    }));
  };

  const placeFranchise = async (name: string) => {
    if (userId == null || gameId == null) return;
    if (!gameState.clickedLocation) {
      console.error('No clicked location available for placement');
      return;
    }

    // Get population from clicked location data
    const locationData = await fetchClickedLocationData(gameState.clickedLocation!.lat, gameState.clickedLocation!.lng);

    const newFranchise: PlacedLocation = {
      id: `${placementMode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lat: gameState.clickedLocation.lat,
      long: gameState.clickedLocation.lng,
      name: name,
      userId: userId,
      username: user?.username ?? 'UNKNOWN',
      county: null,
      state: null,
      metroArea: null,
      locationType: placementMode,
    };

    const result = await placeLocation(
      userId,
      gameId,
      gameState.clickedLocation.lat,
      gameState.clickedLocation.lng,
      name,
      placementMode,
      locationData?.population
    );

    if (result.success) {
      const cost = result.cost ?? 0;
      setGameState(prevState => ({
        ...prevState,
        money: result.remainingMoney ?? prevState.money - cost,
        selectedLocation: newFranchise, // Automatically select the newly placed franchise
        clickedLocation: null, // Clear clicked location
      }));
    } else {
      console.error('Failed to place franchise:', result.error);
      alert(result.error || 'Failed to place franchise');
    }
  };

  // Initial data fetching via HTTP
  useEffect(() => {
    const fetchInitialData = async () => {
      if (userId == null || gameId == null) return;
      const savedColor = await fetchUserHighlightColor(userId);

      // Fetch money for the specific game if we have a gameId, otherwise use default
      const money = await fetchUserGameMoney(userId, gameId);

      setGameState(prevState => ({
        ...prevState,
        highlightColor: savedColor,
        money: money,
      }));

      // Fetch initial game state for current game
      if (gameId && userId) {
        console.log('Fetching initial game state for:', gameId);
        const gameStateResult = await fetchGameState(gameId);
        const { success, gameState, players } = gameStateResult;
        if (!success || !players || !gameState) return;

        const userColors = new Map<string, string>();
        const usedColors = new Set<string>();

        userColors.set(userId, savedColor);
        usedColors.add(savedColor);

        // Assign colors to other players
        players.forEach(playerId => {
          if (playerId !== userId) {
            // Try their default color first
            // Find an available color
            const availableColor = getUserColorUnique(playerId, usedColors);
            userColors.set(playerId, availableColor);
            usedColors.add(availableColor);
          }
        });
        setGameState(prevState => ({
          ...prevState,
          userColors: userColors,
        }));
      }
    };
    fetchInitialData();
  }, [userId, gameId]);

  // Socket connection and event handling
  useEffect(() => {
    const userId = user?.id;
    if (userId == null || gameId == null) return;

    // Always disconnect before reconnecting to ensure clean state
    disconnectFromGameSocket();

    connectToGameSocket({ userId, gameId, setGameState, setIsConnected, showToast });

    return () => {
      disconnectFromGameSocket();
    };
  }, [userId, gameId]); // Removed showToast from dependencies to prevent re-runs

  const getUserSelectedColor = () => {
    if (userId == null) return '#000000';
    return gameState.userColors.get(userId) ?? '#000000';
  };

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
    selectLocation,
    setMapStyle,
    assignUserColors,
    getUserSelectedColor,
    resetGame,
    setClickedLocation,
    selectState,
    placeFranchise,
    placementMode,
    onPlacementModeChange,
  };

  return <GameStateContext.Provider value={contextValue}>{children}</GameStateContext.Provider>;
};
