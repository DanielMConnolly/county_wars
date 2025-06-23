import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState, Franchise } from "./types/GameTypes";
import { socketService } from "./services/socketService";
import { connectToSocket } from "./services/connectToSocket";
import {
  fetchUserCounties,
  fetchUserHighlightColor,
  updateUserHighlightColor,
  fetchUserMoney,
  updateUserMoney,
  fetchGameTime,
  updateGameElapsedTime,
} from "./api_calls/CountyWarsHTTPRequests";
import { getCountyCost } from "./utils/countyUtils";
import { GAME_DEFAULTS } from "./constants/gameDefaults";
import { getDefaultState } from "./utils/getDefaultState";
import { getCurrentGameId } from "./utils/gameUrl";

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>(getDefaultState());
  const [gameId, setGameId] = useState<string>(getCurrentGameId());
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

  // Helper function to conquer a county with cost deduction
  const conquerCounty = async (county: County): Promise<boolean> => {
    try {
      const cost = getCountyCost(county.name);

      // Check if user has enough money
      if (gameState.money < cost) {
        console.log('Insufficient funds to conquer county:',
          county.name, 'Cost:', cost, 'Available:', gameState.money);
        return false;
      }

      // Deduct the cost from user's money
      const newMoney = gameState.money - cost;

      // Update money in database
      const moneyUpdated = await updateUserMoney(userId, newMoney);
      if (!moneyUpdated) {
        console.error('Failed to update money in database');
        return false;
      }

      // Update local state with new money amount
      setGameState((prevState) => ({
        ...prevState,
        money: newMoney,
      }));

      // Now claim the county
      const countyId = county.countyFP + county.stateFP;
      addCounty(countyId);

      console.log(`Successfully conquered ${county.name} for $${cost}. Remaining money: $${newMoney}`);
      return true;
    } catch (error) {
      console.error('Error in conquerCounty:', error);
      return false;
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
    }));
  };

  const placeFranchise = (name: string) => {
    if (!gameState.clickedLocation) {
      console.error('No clicked location available for franchise placement');
      return;
    }

    const newFranchise: Franchise = {
      id: `franchise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lat: gameState.clickedLocation.lat,
      lng: gameState.clickedLocation.lng,
      name: name,
      placedAt: Date.now(),
    };

    setGameState((prevState) => ({
      ...prevState,
      franchises: [...prevState.franchises, newFranchise],
    }));

    console.log('Franchise placed:', newFranchise);
  };

  // Listen for URL changes
  useEffect(() => {
    const handleGameNavigate = (event: any) => {
      const newGameId = event.detail.gameId || 'default-game';
      console.log('Game navigation detected, switching to gameId:', newGameId);
      setGameId(newGameId);
    };

    window.addEventListener('gameNavigate', handleGameNavigate);
    return () => window.removeEventListener('gameNavigate', handleGameNavigate);
  }, []);

  // Initial data fetching via HTTP
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log('Fetching initial data for userId:', userId, 'gameId:', gameId);
      const ownedCounties = await fetchUserCounties(userId, gameId);
      const savedColor = await fetchUserHighlightColor(userId);
      const savedGameTime = await fetchGameTime(gameId);
      const userMoney = await fetchUserMoney(userId);

      setGameState(prevState => ({
        ...prevState,
        ownedCounties: new Set(ownedCounties),
        highlightColor: savedColor,
        money: userMoney,
        gameTime: savedGameTime ? {
         elapsedTime: savedGameTime,
         ...prevState.gameTime,
        } : prevState.gameTime
      }));
    };
    fetchInitialData();
  }, [userId, gameId]);

  // Socket connection and event handling
  useEffect(() => {
    console.log('Socket effect running, userId:', userId);

    // Skip if already connected to avoid reconnections
    if (socketService.isConnected()) {
      console.log('Socket already connected, skipping reconnection');
      return;
    }

    connectToSocket({ userId, gameId, setGameState, setIsConnected });
  }, [userId, gameId]);

  // Time progression logic
  useEffect(() => {
    const interval = setInterval(async() => {
      if (gameState.gameTime.isPaused == true) {
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

        const totalGameMs = prevState.gameTime.gameDurationHours * 60 * 60 * 1000;

        // Calculate progress (0 to 1)
        const progress = Math.min(elapsedTime / totalGameMs, 1);

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
              elapsedTime: elapsedTime,
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
            elapsedTime: elapsedTime,
            year,
            month,
          },
        };
      });
      let currentGameId = gameState.currentGameId;
      if (currentGameId == null) {
        // Try to get game ID from URL if not in state
        const urlGameId = getCurrentGameId();
        if (urlGameId) {
          currentGameId = urlGameId;
          // Update state with the game ID from URL
          setGameState(prev => ({ ...prev, currentGameId: urlGameId }));
        } else {
          console.log('No current game id, skipping autosave');
          return;
        }
      }
      const success = await updateGameElapsedTime(currentGameId, gameState.gameTime.elapsedTime??0);
      if (!success) return;
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [gameState.gameTime.isPaused, gameState.gameTime.startTime, gameState.gameTime.elapsedTime]);

  // Autosave game time every 15 seconds
  // useEffect(() => {
  //   const saveInterval = setInterval(async () => {
  //     console.log('Autosaving game time:', gameState.gameTime);
  //     let currentGameId = gameState.currentGameId;
  //     if (currentGameId == null) {
  //       // Try to get game ID from URL if not in state
  //       const urlGameId = getCurrentGameId();
  //       if (urlGameId) {
  //         currentGameId = urlGameId;
  //         // Update state with the game ID from URL
  //         setGameState(prev => ({ ...prev, currentGameId: urlGameId }));
  //       } else {
  //         console.log('No current game id, skipping autosave');
  //         return;
  //       }
  //     }
  //    const success = await updateGameElapsedTime(currentGameId, gameState.gameTime.elapsedTime??0);
  //     if (!success) {
  //       console.warn('Failed to autosave game time');
  //     }
  //   }, 15000); // Save every 15 seconds

  //   return () => clearInterval(saveInterval);
  // }, [gameState.gameTime, userId, gameState.currentGameId]);

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
    addCounty,
    conquerCounty,
    removeCounty,
    selectCounty,
    setMapStyle,
    setHighlightColor,
    resetGame,
    pauseTime,
    resumeTime,
    setGameDuration,
    setCurrentGame,
    setClickedLocation,
    placeFranchise,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};
