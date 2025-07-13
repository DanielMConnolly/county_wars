import React, { useContext } from 'react';
import { GameStateContext } from '../GameStateContext';
import PlacementInfoCard from './PlacementInfoCard';
import LocationInfoCard from './LocationInfoCard.react';
import StateInfoCard from './StateInfoCard';

/**
 * Standardized wrapper for all info cards to ensure consistent positioning
 */
const InfoCardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-slate-800
  to-slate-900 backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
  >
    {children}
  </div>
);

/**
 * Unified InfoCard component that decides which specific info card to render
 * based on the current game state (clicked location, selected location, or selected state)
 */
const InfoCard: React.FC = () => {
  const { gameState, selectLocation, selectState, placementMode } = useContext(GameStateContext);
  const { clickedLocation, selectedLocation, selectedState } = gameState;

  if (selectedLocation) {
    return <LocationInfoCard location={selectedLocation} onClose={() => selectLocation(null)} />;
  }

  if (selectedState && placementMode === 'explore') {
    return (
      <InfoCardWrapper>
        <StateInfoCard stateName={selectedState} onClose={() => selectState(null)} />
      </InfoCardWrapper>
    );
  }

  if (clickedLocation) {
    return <PlacementInfoCard />;
  }

  return null;
};

export default InfoCard;
