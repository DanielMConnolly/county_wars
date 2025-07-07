import { useState } from 'react';
import { PlacementMode } from './types/GameTypes';

const usePlacementMode = () => {
  const [placementMode, setPlacementMode] = useState<PlacementMode>('franchise');

  const changePlacementMode = (mode: PlacementMode) => {
    setPlacementMode(mode);
    console.log(`Placement mode changed to: ${mode}`);
  };

  return {
    placementMode,
    changePlacementMode,
  };
};

export default usePlacementMode;