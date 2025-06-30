import React, { useContext, useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import {
  getDifficultyDisplayName,
  getDifficultyColor as getNewDifficultyColor,
  calculateDistanceMiles,
} from './utils/countyUtils';
import { GameStateContext } from './GameStateContext';
import { DataTestIDs } from './DataTestIDs';
import { fetchClickedLocationData } from './api_calls/HTTPRequests';

const InfoCard = () => {
  const { gameState, placeFranchise, selectCounty } = useContext(GameStateContext);
  const {  clickedLocation } = gameState;

  if (!clickedLocation) {
    throw new Error('InfoCard should only be rendered when a location is clicked');
  }
  const [population, setPopulation] = useState<number | null>(null);
  const [metro, setMetro] = useState<string | null>(null);
  const [franchiseCost, setFranchiseCost] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const isLocationTooCloseToFranchise = (lat: number, lng: number): boolean => {
    return gameState.franchises.some(franchise => {
      const distance = calculateDistanceMiles(lat, lng, franchise.lat, franchise.long);
      return distance < 5;
    });
  };

  const canAffordFranchise = (): boolean => {
    return gameState.money >= franchiseCost;
  };

  useEffect(() => {
    const fetchLocationInformation = async () => {
      console.log('Fetching location information');
      setMetro(null);
      setPopulation(null);
      setFranchiseCost(100);
      setLoading(true);
      const locationData = await fetchClickedLocationData(clickedLocation.lat, clickedLocation.lng);

      if (locationData.metroAreaName && locationData.metroAreaName !== 'Unknown') {
        setMetro(locationData.metroAreaName);
      }
      setPopulation(locationData.population);
      setFranchiseCost(locationData.franchisePlacementCost);
      setLoading(false);
    };
    fetchLocationInformation();
  }, [clickedLocation]);


  const getLocationLabel = (): string => {
      if (metro) {
        return `${metro}`;
      }
      else{
        return "TBD";
      }
  }


  const isPlaceFranchiseButtonEnabled = (): boolean => {
    if (!clickedLocation) return false;
    if (gameState.gameTime?.isPaused) return false;
    if(isLocationTooCloseToFranchise(clickedLocation.lat, clickedLocation.lng)){
      return false;
    }
    return canAffordFranchise();
  }

  const placeFranchiseButtonText = (): string => {
    if (!clickedLocation) {
      return 'Click Map to Place';
    }
    if (isLocationTooCloseToFranchise(clickedLocation.lat, clickedLocation.lng)) {
      return 'Too Close to Existing Franchise';
    }
    if (!canAffordFranchise()) {
      return 'Insufficient Funds';
    }
    return 'Place Franchise';
  };


  return (
    <div
      data-testid={DataTestIDs.INFO_CARD}
      className="fixed bottom-6 right-6 w-80 bg-gradient-to-br from-slate-800 to-slate-900
        backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-blue-400">Territory Info</h3>
        </div>
        <button
          onClick={() => selectCounty(null)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          aria-label="Close info card"
          data-testid={DataTestIDs.CLOSE_INFO_CARD_BUTTON}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        <InfoRow
          label="Location:"
          value={loading ? 'Loading...': getLocationLabel()}
          className="text-white truncate ml-2"
        />
          <>
            <InfoRow
              label="Population:"
              value={loading ? 'Loading...' : population ? population.toLocaleString() : 'Unknown'}
              className="text-blue-300"
            />
            <InfoRow
              label="Difficulty:"
              value={getDifficultyDisplayName('EASY')}
              className={getNewDifficultyColor('EASY')}
            />
            <InfoRow
              label="Cost:"
              value={loading ? 'Loading...' : `$${franchiseCost}`}
              className="text-yellow-400"
            />
          </>
      </div>
      <button
        data-testid={DataTestIDs.PLACE_FRANCHISE_BUTTON}
        onClick={async () => {
            await placeFranchise(`${getLocationLabel()} Franchise`, metro? metro: "UNKOWN");
        }}
        disabled={!isPlaceFranchiseButtonEnabled()}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-bold
           transition-all duration-300 ${!isPlaceFranchiseButtonEnabled()
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 ' +
            'text-white hover:scale-105 hover:shadow-lg'
          }`}
      >
        {placeFranchiseButtonText()}
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
