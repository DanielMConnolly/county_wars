import { useState, useEffect } from 'react';
import { sampleCounties } from '../../county-conquest-game/src/data/counties';
import { getCost } from '../../county-conquest-game/src/utils/gameUtils';

const useGameState = () => {
  const [gameState, setGameState] = useState({
    ownedCounties: new Set(),
    resources: 1000,
    selectedCounty: null,
    mapStyle: 'terrain'
  });

  const selectCounty = (county) => {
    setGameState(prev => ({ ...prev, selectedCounty: county }));
  };

  const conquestCounty = () => {
    const county = gameState.selectedCounty;
    if (!county || gameState.ownedCounties.has(county.name)) return;

    const cost = getCost(county.difficulty);
    if (gameState.resources < cost) {
      alert('Not enough resources!');
      return;
    }

    setGameState(prev => ({
      ...prev,
      resources: prev.resources - cost,
      ownedCounties: new Set([...prev.ownedCounties, county.name])
    }));
  };

  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the game?')) {
      setGameState({
        ownedCounties: new Set(),
        resources: 1000,
        selectedCounty: null,
        mapStyle: 'terrain'
      });
    }
  };

  const totalPopulation = Array.from(gameState.ownedCounties).reduce((total, countyName) => {
    const county = sampleCounties.find(c => c.name === countyName);
    return total + (county ? county.pop : 0);
  }, 0);

  // Resource generation
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        resources: prev.resources + prev.ownedCounties.size * 10
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    gameState,
    selectCounty,
    conquestCounty,
    resetGame,
    totalPopulation
  };
};

export default useGameState;
