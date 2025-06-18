import useMapControls from './useMapControls';
import GameMap from './GameMap.react';
import InfoCard from './InfoCard';
import TopMenu from './TopMenu';
import MapControls from './MapControls';
import { Timeline } from './Timeline';
import { GameStateProvider } from './GameStateProvider.react';

const App = () => {

  const {
    mapControls,
    changeMapStyle,
    updateZoom,
    toggleMapStyle
  } = useMapControls();

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden relative">
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
          mapControls={mapControls} />

        <InfoCard />
        {/* Timeline at bottom of screen */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50">
          <Timeline />
        </div>
      </GameStateProvider>
    </div>

  );
};

export default App;
