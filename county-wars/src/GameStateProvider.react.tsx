import React, { useState, ReactNode, useEffect } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState } from "./types/GameTypes";
import { socketService } from "./services/socketService";
import { fetchUserCounties, fetchUserHighlightColor } from "./api_calls/fetchDataFromServer";

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
  const setHighlightColor = async (color: string) => {
    // Update local state first for immediate UI feedback
    setGameState((prevState) => ({
      ...prevState,
      highlightColor: color,
    }));

    // Save to database
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/highlight-color`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color }),
      });

      if (!response.ok) {
        console.error('Failed to save highlight color:', response.status);
        // Optionally revert the color change or show an error message
      } else {
        console.log('Highlight color saved successfully:', color);
      }
    } catch (error) {
      console.error('Error saving highlight color:', error);
      // Optionally revert the color change or show an error message
    }
  };

  // Initial data fetching via HTTP
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial data for userId:', userId);
        
        // Fetch initial counties using the extracted function
        const ownedCounties = await fetchUserCounties(userId);
        setGameState(prevState => ({
          ...prevState,
          ownedCounties: new Set(ownedCounties)
        }));
        console.log('Successfully set initial counties');

        // Fetch saved highlight color using the extracted function
        const savedColor = await fetchUserHighlightColor(userId);
        setGameState(prevState => ({
          ...prevState,
          highlightColor: savedColor
        }));
        console.log('Successfully set saved highlight color');
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        // Don't throw the error to prevent crashes
      }
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

    const connectToSocket = async () => {
      try {
        await socketService.connect(userId);
        setIsConnected(true);

        // Set up socket event listeners for real-time updates only
        // Initial county data is now fetched via HTTP above

        socketService.on('county-claimed', (data: { countyName: string }) => {
          try {
            console.log('Received county-claimed event:', data);
            setGameState(prevState => ({
              ...prevState,
              ownedCounties: new Set([...prevState.ownedCounties, data.countyName])
            }));
            console.log('Successfully updated state for county-claimed');
          } catch (error) {
            console.error('Error handling county-claimed event:', error);
          }
        });

        socketService.on('county-released', (data: { countyName: string }) => {
          try {
            console.log('Received county-released event:', data);
            setGameState(prevState => {
              const newOwnedCounties = new Set(prevState.ownedCounties);
              newOwnedCounties.delete(data.countyName);
              return {
                ...prevState,
                ownedCounties: newOwnedCounties
              };
            });
            console.log('Successfully updated state for county-released');
          } catch (error) {
            console.error('Error handling county-released event:', error);
          }
        });

        socketService.on('error', (data: { message: string }) => {
          console.error('Socket error:', data.message);
          // Don't use alert as it can cause page refresh issues
          // Instead, we could show a toast notification or handle it silently
        });

      } catch (error) {
        console.error('Failed to connect to socket:', error);
        setIsConnected(false);
      }
    };

    connectToSocket();
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
