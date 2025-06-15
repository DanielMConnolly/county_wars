
import useGameState from './useGameState';
import useMapControls from './useMapControls';
import GameMap from './GameMap.tsx';
import InfoCard from './InfoCard';
import TopMenu from './TopMenu';
import MapControls from './MapControls';
import React, { useContext } from 'react';
import { GameStateProvider } from './GameStateProvider.react.tsx';

const App = () => {

  const {
    mapControls,
    changeMapStyle,
    updateZoom,
    toggleMapStyle
  } = useMapControls();

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      <GameStateProvider>
      <TopMenu
        onToggleMapStyle={toggleMapStyle}
      />

      <MapControls
        mapControls={mapControls}
        onChangeMapStyle={changeMapStyle}
        onUpdateZoom={updateZoom}
      />

      <GameMap
        mapControls={mapControls}
      />

      <InfoCard
      />
       </GameStateProvider>
    </div>

  );
};

export default App;
