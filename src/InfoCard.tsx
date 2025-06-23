import React, { useContext, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  useIsCountyOwned,
} from './utils/gameUtils';
import {
  calculateCountyDifficulty,
  getCountyCost,
  getDifficultyDisplayName,
  getDifficultyColor as getNewDifficultyColor
} from './utils/countyUtils';
import { GameStateContext } from './GameStateContext';
import { fetchPopulationData } from './api_calls/fetchPopulationData';

const InfoCard = () => {
  const { gameState, placeFranchise } = useContext(GameStateContext);
  const { selectedCounty } = gameState;

  if (!selectedCounty) {
    throw new Error('InfoCard should only be rendered when a county is selected');
  }
  const [population, setPopulation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const isCountyOwned = useIsCountyOwned(selectedCounty);

  useEffect(() => {
    const fetchPopulation = async () => {
      if (!selectedCounty) {
        return;
      }

      setLoading(true);
      const countyPopulation = await fetchPopulationData(selectedCounty);
      if (countyPopulation) {
        setPopulation(countyPopulation);
      } else {
        setPopulation(null);
      }
      setLoading(false);
    };
    fetchPopulation();
  }, [selectedCounty]);


  return (
    <div
      data-testid="info-card"
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
              value={getDifficultyDisplayName(calculateCountyDifficulty(selectedCounty.name))}
              className={getNewDifficultyColor(calculateCountyDifficulty(selectedCounty.name))}
            />
            <InfoRow
              label="Cost:"
              value={`$${getCountyCost(selectedCounty.name)}`}
              className="text-yellow-400"
            />
          </>
        )}
      </div>
      <button
        data-testid="place-franchise-button"
        onClick={() => {
          if (selectedCounty != null) {
            placeFranchise(`${selectedCounty.name} Franchise`);
          }
        }}
        disabled={!gameState.clickedLocation}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-bold
           transition-all duration-300 ${!gameState.clickedLocation
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 ' +
            'text-white hover:scale-105 hover:shadow-lg'
          }`}
      >
        {gameState.clickedLocation ? 'Place Franchise' : 'Click Map to Place'}
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


export default InfoCard;
