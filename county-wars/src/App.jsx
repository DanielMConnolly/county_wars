
import useGameState from './useGameState';
import useMapControls from './useMapControls';
import GameMap from './GameMap';
import InfoCard from './InfoCard';
import TopMenu from './TopMenu';
import MapControls from './MapControls';
import './App.css';

const App = () => {
  const {
    gameState,
    selectCounty,
    conquestCounty,
    resetGame,
    totalPopulation
  } = useGameState();

  const {
    mapControls,
    changeMapStyle,
    updateZoom,
    toggleMapStyle
  } = useMapControls();

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      <TopMenu
        gameState={gameState}
        totalPopulation={totalPopulation}
        onToggleMapStyle={toggleMapStyle}
        onReset={resetGame}
      />

      <MapControls
        mapControls={mapControls}
        onChangeMapStyle={changeMapStyle}
        onUpdateZoom={updateZoom}
      />

      <GameMap
        gameState={gameState}
        mapControls={mapControls}
        onSelectCounty={selectCounty}
      />

      <InfoCard
        gameState={gameState}
        onConquest={conquestCounty}
      />
    </div>
  );
};

export default App;
