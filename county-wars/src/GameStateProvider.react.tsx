import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState } from "./types/GameTypes";
import { socketService } from "./services/socketService";

interface GameStateProviderProps {
  children: ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    ownedCounties: new Set<string>(),
    resources: 1000,
    selectedCounty: null,
    mapStyle: "terrain",
    population: 1000,
    highlightColor: "red",
  });
  const [userId] = useState<string>(() => {
    // Try to get existing userId from localStorage
    const savedUserId = localStorage.getItem('county-wars-user-id');
    if (savedUserId) {
      return savedUserId;
    }
    // Generate new userId and save it
    const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('county-wars-user-id', newUserId);
    return newUserId;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Helper function to add a county
  const addCounty = (countyInfo: County) => {
    const countyId = countyInfo.name + countyInfo.state;
    if (isConnected) {
      socketService.claimCounty(countyId);
    } else {
      setGameState((prevState) => ({
        ...prevState,
        ownedCounties: new Set([...prevState.ownedCounties, countyId]),
      }));
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

  // Helper function to update resources
  const updateResources = (amount: number) => {
    setGameState((prevState) => ({
      ...prevState,
      resources: Math.max(0, prevState.resources + amount),
    }));
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
      setGameState({
        ownedCounties: new Set(),
        resources: 1000,
        selectedCounty: null,
        mapStyle: "terrain",
        highlightColor: "red",
        population: 1000,
      });
    }
  };

  // Helper function to set highlight color
  const setHighlightColor = (color: string) => {
    setGameState((prevState) => ({
      ...prevState,
      highlightColor: color,
    }));
  };

  // Socket connection and event handling
  useEffect(() => {
    const connectToSocket = async () => {
      try {
        await socketService.connect(userId);
        setIsConnected(true);
        
        // Set up socket event listeners
        socketService.on('counties-update', (data: { ownedCounties: string[] }) => {
          console.log('Received counties from server:', data.ownedCounties);
          setGameState(prevState => ({
            ...prevState,
            ownedCounties: new Set(data.ownedCounties)
          }));
        });
        
        socketService.on('county-claimed', (data: { countyName: string }) => {
          setGameState(prevState => ({
            ...prevState,
            ownedCounties: new Set([...prevState.ownedCounties, data.countyName])
          }));
        });
        
        socketService.on('county-released', (data: { countyName: string }) => {
          setGameState(prevState => {
            const newOwnedCounties = new Set(prevState.ownedCounties);
            newOwnedCounties.delete(data.countyName);
            return {
              ...prevState,
              ownedCounties: newOwnedCounties
            };
          });
        });
        
        socketService.on('error', (data: { message: string }) => {
          console.error('Socket error:', data.message);
          alert(data.message);
        });
        
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        setIsConnected(false);
      }
    };
    
    connectToSocket();
    
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [userId]);

  const contextValue: GameStateContextType = {
    gameState,
    setGameState,
    addCounty,
    removeCounty,
    updateResources,
    selectCounty,
    setMapStyle,
    setHighlightColor,
    resetGame,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};
