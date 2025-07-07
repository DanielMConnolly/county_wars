import { useContext } from 'react';
import useMapControls from './useMapControls';
import GameMap from './GameMap.react';
import InfoCard from './InfoCard';
import LocationInfoCard from './LocationInfoCard.react';
import TopMenu from './TopMenu';
import MapControls from './MapControls';
import PlacementModeToggle from './components/PlacementModeToggle';
import { Timeline } from './Timeline';
import { GameStateProvider } from './GameStateProvider.react';
import { GameStateContext } from './GameStateContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import WelcomeScreen from './WelcomeScreen';
import AuthModal from './auth/AuthModal';
import { ToastProvider } from './Toast/ToastContext';
import ToastContainer from './Toast/ToastContainer';
import GameLobby from './GameLobby/GameLobby';


const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <WelcomeScreen />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/signup",
      element: <SignupPage />,
    },
    {
      path: "/lobby/:gameId",
      element: <GameLobby />,
    },
    {
      path: '/game/:gameId', // Parameterized path for gameId
      element: (<GameStateProvider>
        <AppContent />
      </GameStateProvider>)
    }
  ]);
  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden relative">

      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </div>
  );
};

const AppContent = () => {
  const { gameState, selectLocation } = useContext(GameStateContext);
  const { clickedLocation, selectedLocation} = gameState;
  const { user, loading } = useAuth();

  const {
    mapControls,
    changeMapStyle,
    updateZoom,
    changeBoundaryType,
  } = useMapControls();


  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login modal if user is not authenticated
  if (!user) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center relative">
        <div className="text-center mb-8 z-10">
          <h1 className="text-4xl font-bold text-white mb-4">Franchise Wars</h1>
          <p className="text-gray-300 text-lg">Please log in to start playing</p>
        </div>
        <AuthModal isOpen={true} onClose={() => { }} />
      </div>
    );
  }

  // Show main game interface for authenticated users with a selected game
  return (
    <>
      <ToastContainer />
      <TopMenu />

      <MapControls
        mapControls={mapControls}
        onChangeMapStyle={changeMapStyle}
        onUpdateZoom={updateZoom}
        onChangeBoundaryType={changeBoundaryType}
      />

      <PlacementModeToggle />

      <GameMap
       mapControls={mapControls}
      />

      {clickedLocation && <InfoCard />}
      {selectedLocation && (
        <LocationInfoCard
          location={selectedLocation}
          onClose={() => selectLocation(null)}
        />
      )}
      {/* Timeline at bottom of screen */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50">
        <Timeline />
      </div>
    </>
  );
};


export default App;
