import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { GameState, Franchise, PlacementMode, PlacedLocation } from "./types/GameTypes";
import { gameSocketService } from "./services/gameSocketService";
import { connectToGameSocket, disconnectFromGameSocket } from "./services/connectToGameSocket";
import {
  fetchUserHighlightColor,
  updateUserHighlightColor,
  fetchUserGameMoney,
  placeLocation,
  placeDistributionCenter,
  fetchGameState,
} from "./api_calls/HTTPRequests";
import { GAME_DEFAULTS } from "./constants/gameDefaults";
import { getDefaultState } from "./utils/getDefaultState";
import { getCurrentGameId } from "./utils/gameUrl";
import useInterval from "./utils/useInterval";
import { getMonthAndYear } from "./utils/useGetMonthAndYear";
import { useAuth } from "./auth/AuthContext";
import { useToast } from "./Toast/ToastContext";
import { getUserColorUnique } from "./utils/colorUtils";

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>(getDefaultState());
  const [gameId, setGameId] = useState<string | null>(getCurrentGameId());
  const [placementMode, setPlacementMode] = useState<PlacementMode>('franchise');
  const { user } = useAuth();
  const [_, setIsConnected] = useState<boolean>(false);
  const { showToast } = useToast();

  const userId = user?.id;

  // Helper function to select a franchise
  const selectLocation = (location: PlacedLocation| null) => {
    setGameState((prevState) => ({
      ...prevState,
      selectedLocation: location,
      clickedLocation: null,
    }));
  };

  // Helper function to set map style
  const setMapStyle = (style: string) => {
    setGameState((prevState) => ({
      ...prevState,
      mapStyle: style,
    }));
  };

  const resetGame = () => {
    if (window.confirm("Are you sure you want to reset the game?")) {
      setGameState(getDefaultState());
    }
  };

  // Time management functions
  const pauseTime = () => {
    setGameState((prevState) => ({
      ...prevState,
      gameTime: {
        ...prevState.gameTime,
        isPaused: true,
      },
    }));

    // Emit socket event to notify other players
    gameSocketService.pauseGame();
  };

  const resumeTime = () => {
    setGameState((prevState) => ({
      ...prevState,
      gameTime: {
        ...prevState.gameTime,
        isPaused: false,
      },
    }));

    // Emit socket event to notify other players
    gameSocketService.resumeGame();
  };

  const setGameDuration = (hours: number) => {
    setGameState((prevState) => ({
      ...prevState,
      gameTime: {
        ...prevState.gameTime,
        gameDurationHours: hours,
        startTime: Date.now(), // Reset start time when duration changes
        year: GAME_DEFAULTS.START_YEAR,
        month: GAME_DEFAULTS.START_MONTH,
      },
    }));
  };

  const setCurrentGame = (gameId: string | null) => {
    setGameState((prevState) => ({
      ...prevState,
      currentGameId: gameId,
    }));
    if (gameId) {
      setGameId(gameId);
    }
  };

  const setClickedLocation = (location: { lat: number, lng: number } | null) => {
    setGameState((prevState) => ({
      ...prevState,
      clickedLocation: location,
      selectedLocation: null,
    }));
  }

  const onPlacementModeChange = (mode: PlacementMode) => {
    setPlacementMode(mode);
  };


  const assignUserColors = async (newHighlightColor: string) => {
    if (userId == null) return;
    await updateUserHighlightColor(userId, newHighlightColor);
    const newUserColors = new Map(gameState.userColors);
    let existingUserWithNewColor = null;
    gameState.userColors.forEach(
      (color, user) => {
        if (user != userId && color === newHighlightColor) {
          existingUserWithNewColor = user;
        }
      }
    );
    newUserColors.set(userId, newHighlightColor)
    if (existingUserWithNewColor) {
      const uniqueColor = getUserColorUnique(existingUserWithNewColor, new Set(gameState.userColors.values()));
      newUserColors.set(existingUserWithNewColor, uniqueColor);
    }

    setGameState((prevState) => ({
      ...prevState,
      userColors: newUserColors,
    }));
  }


  const placeFranchise = async (name: string) => {
    if (userId == null || gameId == null) return;
    if (!gameState.clickedLocation) {
      console.error('No clicked location available for placement');
      return;
    }
    const newFranchise: PlacedLocation = {
      id: `${placementMode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lat: gameState.clickedLocation.lat,
      long: gameState.clickedLocation.lng,
      name: name,
      placedAt: gameState.gameTime.elapsedTime || 0,
      userId: userId,
      username: user?.username ?? "UNKNOWN",
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
      gameState.gameTime.elapsedTime || 0,
      placementMode
    );

    if (result.success) {
      const cost = result.cost ?? 0;
      setGameState((prevState) => ({
        ...prevState,
        money: result.remainingMoney ?? prevState.money - cost,
        selectedLocation: newFranchise, // Automatically select the newly placed franchise
        clickedLocation: null, // Clear clicked location
      }));

      console.log('Franchise placed:', newFranchise, 'Cost:', result.cost);
      // Note: Server will emit location-added event and money-update event to keep all clients synchronized
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
          gameTime: {
            ...prevState.gameTime,
            elapsedTime: gameState!.elapsedTime,
            isPaused: gameState!.isPaused
          },
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


  useInterval(() => {
    if (gameState.gameTime.isPaused == true || userId == null) {
      return;
    }
    setGameState((prevState) => {
      let elapsedTime;
      if (prevState?.gameTime?.elapsedTime != null) {
        elapsedTime = 1000 + prevState?.gameTime?.elapsedTime;
      }
      else {
        elapsedTime = 1000;
      }


      const { month, year } = getMonthAndYear({ ...prevState.gameTime, elapsedTime: elapsedTime });

      // Don't update if we're already at the end
      if (year >= 2025 && month >= 12) {
        return {
          ...prevState,
          gameTime: {
            ...prevState.gameTime,
            isPaused: true, // Auto-pause when reaching the end
          },
        };
      }

      return {
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          elapsedTime: elapsedTime,
          year,
          month,
        },
      };
    });
  }, GAME_DEFAULTS.NUMBER_OF_MILLISECONDS_TO_UPDATE_GAME_IN);

  const getUserSelectedColor = () => {
    if (userId == null) return '#000000';
    return gameState.userColors.get(userId) ?? '#000000';
  }

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
    selectLocation,
    setMapStyle,
    assignUserColors,
    getUserSelectedColor,
    resetGame,
    pauseTime,
    resumeTime,
    setGameDuration,
    setClickedLocation,
    placeFranchise,
    placementMode,
    onPlacementModeChange,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};
