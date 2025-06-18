import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState } from "./types/GameTypes";
import { socketService } from "./services/socketService";
import { connectToSocket } from "./services/connectToSocket";
import {
  fetchUserCounties,
  fetchUserHighlightColor,
  updateUserHighlightColor,
} from "./api_calls/CountyWarsHTTPRequests";
import { GAME_DEFAULTS } from "./constants/gameDefaults";
import { getDefaultState } from "./utils/getDefaultState";

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>(getDefaultState());
  const [userId] = useState<string>(() => {
    // Try to get existing userId from localStorage
    const savedUserId = localStorage.getItem('county-wars-user-id');
    if (savedUserId) {
      console.log('Using existing userId:', savedUserId);
      return savedUserId;
    }
    // Generate new userId and save it
    const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated new userId:', newUserId);
    localStorage.setItem('county-wars-user-id', newUserId);
    return newUserId;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Helper function to add a county
  const addCounty = (countyName: string) => {
    try {
      if (isConnected) {
        console.log('Socket connected, claiming county via socket');
        socketService.claimCounty(countyName);
      } else {
        console.log('Socket not connected, updating state directly');
        setGameState((prevState) => ({
          ...prevState,
          ownedCounties: new Set([...prevState.ownedCounties, countyName]),
        }));
      }
      console.log('addCounty completed successfully');
    } catch (error) {
      console.error('Error in addCounty:', error);
      // Don't throw the error, just log it to prevent crashes
    }
  };

  // Helper function to remove a county
  const removeCounty = (countyId: string) => {
    if (isConnected) {
      socketService.releaseCounty(countyId);
    } else {
      setGameState((prevState) => {
        const newOwnedCounties = new Set(prevState.ownedCounties);
        newOwnedCounties.delete(countyId);
        return {
          ...prevState,
          ownedCounties: newOwnedCounties,
        };
      });
    }
  };

  // Helper function to select a county
  const selectCounty = (countyInfo: County) => {
    setGameState((prevState) => ({
      ...prevState,
      selectedCounty: countyInfo
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
      // Release all owned counties first
      if (isConnected) {
        gameState.ownedCounties.forEach(countyId => {
          socketService.releaseCounty(countyId);
        });
      }
      setGameState(getDefaultState());
    }
  };

  const setHighlightColor = async (color: string) => {
    setGameState((prevState) => ({
      ...prevState,
      highlightColor: color,
    }));
    const successfullyUpdated = await updateUserHighlightColor(userId, color);
    if (!successfullyUpdated) {
      alert('Failed to update highlight color. Please try again.');
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
  };

  const resumeTime = () => {
    setGameState((prevState) => ({
      ...prevState,
      gameTime: {
        ...prevState.gameTime,
        isPaused: false,
      },
    }));
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

  // Initial data fetching via HTTP
  useEffect(() => {
    const fetchInitialData = async () => {
      const ownedCounties = await fetchUserCounties(userId);
      const savedColor = await fetchUserHighlightColor(userId);
      setGameState(prevState => ({
        ...prevState,
        ownedCounties: new Set(ownedCounties),
        highlightColor: savedColor
      }));
    };
    fetchInitialData();
  }, [userId]);

  // Socket connection and event handling
  useEffect(() => {
    console.log('Socket effect running, userId:', userId);

    // Skip if already connected to avoid reconnections
    if (socketService.isConnected()) {
      console.log('Socket already connected, skipping reconnection');
      return;
    }

    connectToSocket({ userId, setGameState, setIsConnected });
  }, [userId]);

  // Time progression logic
  useEffect(() => {
    if (gameState.gameTime.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setGameState((prevState) => {
        const now = Date.now();
        const elapsedMs = now - prevState.gameTime.startTime;
        const totalGameMs = prevState.gameTime.gameDurationHours * 60 * 60 * 1000;

        // Calculate progress (0 to 1)
        const progress = Math.min(elapsedMs / totalGameMs, 1);

        // Total months from 1945 to 2025 (80 years * 12 months)
        const totalMonths = 80 * 12;
        const currentMonthIndex = Math.floor(progress * totalMonths);

        // Convert back to year and month
        const year = 1945 + Math.floor(currentMonthIndex / 12);
        const month = (currentMonthIndex % 12) + 1;

        // Don't update if we're already at the end
        if (year >= 2025 && month >= 12) {
          return {
            ...prevState,
            gameTime: {
              ...prevState.gameTime,
              year: 2025,
              month: 12,
              isPaused: true, // Auto-pause when reaching the end
            },
          };
        }

        return {
          ...prevState,
          gameTime: {
            ...prevState.gameTime,
            year,
            month,
          },
        };
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [gameState.gameTime.isPaused, gameState.gameTime.startTime, gameState.gameTime.gameDurationHours]);

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
    addCounty,
    removeCounty,
    selectCounty,
    setMapStyle,
    setHighlightColor,
    resetGame,
    pauseTime,
    resumeTime,
    setGameDuration,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};
