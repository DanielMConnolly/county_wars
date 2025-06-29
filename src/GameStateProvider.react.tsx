import React, { useState, ReactNode, useEffect} from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState, Franchise } from "./types/GameTypes";
import { socketService } from "./services/socketService";
import { connectToSocket } from "./services/connectToSocket";
import {
  fetchUserHighlightColor,
  updateUserHighlightColor,
  fetchUserMoney,
  updateUserMoney,
  placeFranchise as placeFranchiseAPI,
  fetchGameState,
} from "./api_calls/CountyWarsHTTPRequests";
import { GAME_DEFAULTS } from "./constants/GAMEDEFAULTS";
import { getDefaultState } from "./utils/getDefaultState";
import { getCurrentGameId } from "./utils/gameUrl";
import useInterval from "./utils/useInterval";
import { getCountyCost } from "./utils/countyUtils";
import { getMonthAndYear } from "./utils/useGetMonthAndYear";
import { useAuth } from "./auth/AuthContext";

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>(getDefaultState());
  const [gameId, setGameId] = useState<string>(getCurrentGameId());
  const {user} = useAuth();
  const [_, setIsConnected] = useState<boolean>(false);

  const userId = user?.id;


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
    if (userId == null) return;
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

    // Emit socket event to notify other players
    socketService.pauseGame();
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
    socketService.resumeGame();
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
    if (userId == null) return;
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
      userId: userId,
      username: user?.username?? "UNKNOWN"
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

      // Emit socket event to notify other players
      socketService.placeFranchise(newFranchise);

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
      if (userId == null) return;
      const savedColor = await fetchUserHighlightColor(userId);
      const userMoney = await fetchUserMoney(userId);

      setGameState(prevState => ({
        ...prevState,
        highlightColor: savedColor,
        money: userMoney,
      }));

      // Fetch initial game state for current game
      if (gameId && gameId !== 'default-game') {
        console.log('Fetching initial game state for:', gameId);
        const gameStateResult = await fetchGameState(gameId);
        if (gameStateResult.success && gameStateResult.gameState) {
          console.log('Initial game state fetched:', gameStateResult.gameState);
          setGameState(prevState => ({
            ...prevState,
            gameTime: {
              ...prevState.gameTime,
              elapsedTime: gameStateResult.gameState!.elapsedTime,
              isPaused: gameStateResult.gameState!.isPaused
            }
          }));
        } else {
          console.warn('Failed to fetch initial game state:', gameStateResult.error);
        }
      }
    };
    fetchInitialData();
  }, [userId, gameId]);

  // Socket connection and event handling
  useEffect(() => {
    const userId = user?.id;
    if (userId == null) return;
    console.log('Socket effect running, userId:', userId, 'gameId:', gameId);

    // Always disconnect before reconnecting to ensure clean state
    socketService.disconnect();
    console.log('Disconnected previous socket connection');

    connectToSocket({ userId, gameId, setGameState, setIsConnected });
  }, [userId, gameId]);


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
