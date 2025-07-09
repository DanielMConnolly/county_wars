import React, { useContext, useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import {
  validateLocationPlacement,
} from './utils/countyUtils';
import { GameStateContext } from './GameStateContext';
import { DataTestIDs } from './DataTestIDs';
import { fetchClickedLocationData, fetchDistributionCenterCost } from './api_calls/HTTPRequests';
import { ClickedLocationData } from './types/GameTypes';
import { getCurrentGameId } from './utils/gameUrl';
import InfoRow from './components/InfoRow';
import { useAuth } from './auth/AuthContext';

const InfoCard = () => {
  const { gameState, placeFranchise, setClickedLocation, placementMode} = useContext(GameStateContext);
  const { user } = useAuth();
  const {  clickedLocation } = gameState;

  if (!clickedLocation) {
    throw new Error('InfoCard should only be rendered when a location is clicked');
  }
  const [locationData, setLocationData] = useState<ClickedLocationData | null>(null);
  const [distributionCenterCost, setDistributionCenterCost] = useState<{
    cost: number;
    isFirstDistributionCenter: boolean;
    existingDistributionCenters: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocationValidation = (lat: number, lng: number) => {
    if (!user?.id) return { isValid: false, errorMessage: 'User not authenticated' };

    return validateLocationPlacement(
      lat,
      lng,
      user.id,
      placementMode,
      gameState.locations
    );
  };

  const canAffordFranchise = (): boolean => {
    if (placementMode === 'distribution-center') {
      if (!distributionCenterCost) return false;
      return gameState.money >= distributionCenterCost.cost;
    } else {
      if (!locationData) return false;
      return gameState.money >= locationData?.franchisePlacementCost;
    }
  };

  const getCurrentCost = (): number => {
    if (placementMode === 'distribution-center') {
      return distributionCenterCost?.cost ?? 0;
    } else {
      return locationData?.franchisePlacementCost ?? 0;
    }
  };

  const getCostDisplay = (): string => {
    const cost = getCurrentCost();
    if (placementMode === 'distribution-center' && distributionCenterCost?.isFirstDistributionCenter) {
      return `$${cost.toLocaleString()} (FREE!)`;
    }
    return `$${cost.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchLocationInformation = async () => {
      setLocationData(null);
      setDistributionCenterCost(null);
      setLoading(true);

      const locationData = await fetchClickedLocationData(clickedLocation.lat, clickedLocation.lng);
      if (locationData == null){
        throw new Error('Failed to fetch location information');
      }
      setLocationData(locationData);

      // Also fetch distribution center cost if in distribution center mode
      if (placementMode === 'distribution-center' && user?.id) {
        const gameId = getCurrentGameId();
        if (gameId) {
          const distributionCenterCostData = await fetchDistributionCenterCost(gameId, user.id);
          setDistributionCenterCost(distributionCenterCostData);
        }
      }

      setLoading(false);
    };
    fetchLocationInformation();
  }, [clickedLocation, placementMode, user?.id]);


  const getLocationLabel = (): string => {
      if (locationData?.metroAreaName) {
        return `${locationData?.metroAreaName}, ${locationData?.state}`;
      }
      else{
        return `${locationData?.county}, ${locationData?.state}`
      }
  }


  const isPlaceFranchiseButtonEnabled = (): boolean => {
    if (!clickedLocation) return false;

    const validation = getLocationValidation(clickedLocation.lat, clickedLocation.lng);
    if (!validation.isValid) return false;

    return canAffordFranchise();
  }

  const placeFranchiseButtonText = (): string => {
    if (!clickedLocation) {
      return 'Click Map to Place';
    }

    const validation = getLocationValidation(clickedLocation.lat, clickedLocation.lng);
    if (!validation.isValid) {
      // Show specific error message with distance info when available
      if (validation.distance && validation.nearestLocation) {
        if (validation.errorMessage === 'Too close to existing franchise') {
          return `Too close to franchise (${validation.distance} mi)`;
        } else if (validation.errorMessage === 'Too far from distribution center') {
          return `Too far from distribution center (${validation.distance} mi)`;
        }
      }
      return validation.errorMessage || 'Cannot place here';
    }

    if (!canAffordFranchise()) {
      return 'Insufficient Funds';
    }

    const locationTypeText = placementMode === 'distribution-center' ? 'Distribution Center' : 'Franchise';
    return `Place ${locationTypeText}`;
  };


  return (
    <div
      data-testid={DataTestIDs.INFO_CARD}
      className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-slate-800 to-slate-900
        backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-blue-400">Territory Info</h3>
        </div>
        <button
          onClick={() => setClickedLocation(null)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          aria-label="Close info card"
          data-testid={DataTestIDs.CLOSE_INFO_CARD_BUTTON}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-300">Loading location data...</span>
          </div>
        ) : (
          <>
            <InfoRow
              label="Location:"
              value={getLocationLabel()}
              className="text-white ml-2"
            />
            <InfoRow
              label="Population:"
              value={`${locationData?.population?.toLocaleString()}`}
              className="text-blue-300"
            />
            <InfoRow
              label="Cost:"
              value={getCostDisplay()}
              className="text-yellow-400"
            />
          </>
        )}
      </div>
      <button
        data-testid={DataTestIDs.PLACE_FRANCHISE_BUTTON}
        onClick={async () => {
            const locationType = placementMode === 'distribution-center' ? 'Distribution Center' : 'Franchise';
            await placeFranchise(`${getLocationLabel()} ${locationType}`);
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



export default InfoCard;
