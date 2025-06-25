import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState, Franchise } from "./types/GameTypes";
import { socketService } from "./services/socketService";
import { connectToSocket } from "./services/connectToSocket";
import {
  fetchUserHighlightColor,
  updateUserHighlightColor,
  fetchUserMoney,
  updateUserMoney,
  updateGameElapsedTime,
  placeFranchise as placeFranchiseAPI,
} from "./api_calls/CountyWarsHTTPRequests";
import { GAME_DEFAULTS } from "./constants/GAMEDEFAULTS";
import { getDefaultState } from "./utils/getDefaultState";
import { getCurrentGameId } from "./utils/gameUrl";
import useInterval from "./utils/useInterval";
import { getCountyCost } from "./utils/countyUtils";
import { getMonthAndYear } from "./utils/useGetMonthAndYear";

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
  const [_, setIsConnected] = useState<boolean>(false);


  // Helper function to select a county
  const selectCounty = (countyInfo: County | null) => {
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

  const placeFranchise = async (name: string) => {
    if (!gameState.clickedLocation) {
      console.error('No clicked location available for franchise placement');
      return;
    }

    if (!gameState.selectedCounty) {
      console.error('No selected county available for franchise placement');
      return;
    }

    const franchiseCost = getCountyCost(gameState.selectedCounty.name);

    if (gameState.money < franchiseCost) {
      console.error('Insufficient funds to place franchise');
      return;
    }

    const newFranchise: Franchise = {
      id: `franchise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lat: gameState.clickedLocation.lat,
      long: gameState.clickedLocation.lng,
      name: name,
      placedAt: Date.now(),
    };

    const result = await placeFranchiseAPI(
      userId,
      gameId,
      gameState.clickedLocation.lat,
      gameState.clickedLocation.lng,
      name,
      gameState.selectedCounty.name
    );

    if (result.success) {
      setGameState((prevState) => ({
        ...prevState,
        franchises: [...prevState.franchises, newFranchise],
        money: result.remainingMoney ?? prevState.money - franchiseCost,
      }));

      console.log('Franchise placed:', newFranchise, 'Cost:', result.cost || franchiseCost);
    } else {
      console.error('Failed to place franchise:', result.error);
      alert(result.error || 'Failed to place franchise');
    }
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
      const savedColor = await fetchUserHighlightColor(userId);
      const userMoney = await fetchUserMoney(userId);

      setGameState(prevState => ({
        ...prevState,
        highlightColor: savedColor,
        money: userMoney,
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
  useInterval(
    async () => {
      console.log('Autosaving game time:', gameState.gameTime);
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
      const success = await updateGameElapsedTime(currentGameId, gameState.gameTime.elapsedTime ?? 12222);
      if (!success) {
        console.warn('Failed to autosave game time');
      }
    }, 15000
  )

  useInterval(() => {
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

      // Check if a new year has started to award annual income
      let newMoney = prevState.money;
      const { month: previousMonth, year: _ }
        = getMonthAndYear(
          { ...gameState.gameTime, elapsedTime: elapsedTime - GAME_DEFAULTS.NUMBER_OF_MILLISECONDS_TO_UPDATE_GAME_IN });
      if (month === 1 && previousMonth === 12) {
        newMoney = prevState.money + GAME_DEFAULTS.ANNUAL_INCOME;
        updateUserMoney(userId, newMoney).then(success => {
          if (!success) {
            console.warn('Failed to update money on server for annual income');
          }
        });
      }

      return {
        ...prevState,
        money: newMoney,
        gameTime: {
          ...prevState.gameTime,
          elapsedTime: elapsedTime,
          year,
          month,
        },
      };
    });
  }, GAME_DEFAULTS.NUMBER_OF_MILLISECONDS_TO_UPDATE_GAME_IN);

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
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
