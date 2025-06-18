import React, { useContext, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  calculateDifficultyScoreBasedOnPopulation,
  getCost,
  useIsCountyOwned,
  getDifficultyLevel,
  getDifficultyColor
} from './utils/gameUtils';
import { GameStateContext } from './GameStateContext';
import { fetchPopulationData } from './api_calls/fetchPopulationData';
import { County, GameState } from './types/GameTypes';

const InfoCard = () => {
  const { gameState, addCounty } = useContext(GameStateContext);
  const { selectedCounty } = gameState;

  if (!selectedCounty) {
    throw new Error('InfoCard should only be rendered when a county is selected');
  }
  const [population, setPopulation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [difficultyScore, setDifficultyScore] = useState<number | null>(null);
  const isCountyOwned = useIsCountyOwned(selectedCounty);

  useEffect(() => {
    const fetchPopulation = async () => {
      if (!selectedCounty) {
        return;
      }

      setLoading(true);
      const countyPopulation = await fetchPopulationData(selectedCounty);
      if (countyPopulation) {
        const difficultyScore = calculateDifficultyScoreBasedOnPopulation(countyPopulation);
        setPopulation(countyPopulation);
        setDifficultyScore(difficultyScore);
      } else {
        setPopulation(null);
        setDifficultyScore(null);
      }
      setLoading(false);
    };
    fetchPopulation();
  }, [selectedCounty]);


  const buttonText = getButtonText(selectedCounty, gameState);
  const isButtonDisabled = getIsButtonDisabled(selectedCounty, gameState);

  return (
    <div
      className="fixed bottom-6 right-6 w-80 bg-gradient-to-br from-slate-800 to-slate-900
        backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-600">
        <Zap className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-bold text-blue-400">Territory Info</h3>
      </div>
      <div className="space-y-3">
        <InfoRow
          label="Selected:"
          value={selectedCounty?.name || 'None'}
          className="text-white truncate ml-2"
        />
        {selectedCounty && (
          <>
            <InfoRow
              label="Population:"
              value={loading ? 'Loading...' : population ? population.toLocaleString() : 'Unknown'}
              className="text-blue-300"
            />

            <InfoRow
              label="Status:"
              value={isCountyOwned ? 'Owned' : 'Neutral'}
              className={isCountyOwned ? 'text-green-400' : 'text-yellow-400'}
            />

            <InfoRow
              label="Difficulty:"
              value={
                loading
                  ? 'Loading...'
                  : difficultyScore !== null
                    ? `${getDifficultyLevel(difficultyScore)} (${difficultyScore})`
                    : 'Unknown'
              }
              className={
                difficultyScore !== null
                  ? getDifficultyColor(getDifficultyLevel(difficultyScore))
                  : 'text-gray-400'
              }
            />
            <InfoRow
              label="Cost:"
              value={
                difficultyScore !== null
                  ? `${getCost(getDifficultyLevel(difficultyScore))} resources`
                  : `${getCost('Easy')} resources`
              }
              className="text-yellow-400"
            />
          </>
        )}
      </div>
      <button
        data-testid="conquer-territory-button"
        onClick={() => {
          if (selectedCounty != null) {
            addCounty(selectedCounty.countyFP + selectedCounty.stateFP)
          }
        }}
        disabled={isButtonDisabled}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-bold transition-all duration-300 ${isButtonDisabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 ' +
            'text-white hover:scale-105 hover:shadow-lg'
          }`}
      >
        {buttonText}
      </button>
    </div>
  );
};

const InfoRow = ({ label, value, className }: { label: string, value: string, className: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <span className={`font-semibold ${className}`}>{value}</span>
  </div>
);

const getButtonText = (county: County, gameState: GameState): string => {
  if (gameState.ownedCounties.has(county.countyFP + county.stateFP)) {
    return 'Already Owned';
  }
  if (gameState.gameTime.isPaused) {
    return 'Game Paused';
  }
  return 'Conquer Territory';
};

const getIsButtonDisabled = (county: County, gameState: GameState): boolean => {
  if (gameState.gameTime.isPaused) {
    return true;
  }
  return (gameState.ownedCounties.has(county.countyFP + county.stateFP));
};

export default InfoCard;
