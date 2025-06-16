import React, { useState, ReactNode } from "react";
import { GameStateContext, GameStateContextType } from "./GameStateContext";
import { County, GameState } from "./types/GameTypes";

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

  // Helper function to add a county
  const addCounty = (countyInfo: County) => {
    setGameState((prevState) => ({
      ...prevState,
      ownedCounties: new Set([...prevState.ownedCounties, countyInfo.name + countyInfo.state]),
    }));
  };

  // Helper function to remove a county
  const removeCounty = (countyId: string) => {
    setGameState((prevState) => {
      const newOwnedCounties = new Set(prevState.ownedCounties);
      newOwnedCounties.delete(countyId);
      return {
        ...prevState,
        ownedCounties: newOwnedCounties,
      };
    });
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
