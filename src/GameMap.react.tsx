import { useContext, useEffect, useRef} from 'react';
import { mapStyles, getAttribution } from './data/mapStyles';
import { map, marker, circle } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import leaflet from 'leaflet';

import { GameStateContext } from './GameStateContext';
import { MapControls } from './types/GameTypes';
import React from 'react';
import { DataTestIDs } from './DataTestIDs';
import { fetchGame, getGameFranchises } from './api_calls/HTTPRequests';
import { getCurrentGameId } from './utils/gameUrl';
import { createFranchiseIcon } from './FranchiseIcon';
import { useAuth } from './auth/AuthContext';
import { getFranchiseColor } from './utils/colorUtils';
import { useToast } from './Toast/ToastContext';
import { loadCounties, loadStates } from './GameMapHelper';
import { GAME_DEFAULTS } from './constants/gameDefaults';

const GameMap = ({ mapControls }: { mapControls: MapControls }): React.ReactNode => {
  const { gameState, selectLocation, setClickedLocation, setGameState, placementMode } =
    useContext(GameStateContext);
  const { user } = useAuth();

  const { userColors, locations } = gameState;

  const { showToast } = useToast();
  const gameID = getCurrentGameId();

  const { boundaryType } = mapControls;

  // Assert that gameID is non-null
  if (!gameID) {
    throw new Error(
      'GameMap: gameID cannot be null. Ensure the component is used within a valid game context.'
    );
  }

  // TypeScript assertion: gameID is guaranteed to be non-null after the check above
  const gameId: string = gameID;

  useEffect(() => {
    async function loadGameData() {
      const franchises = (await getGameFranchises(gameId)).franchises;
      const {game} = await fetchGame(gameId);
      if (franchises == null) return;
      setGameState(gameState => ({
        ...gameState,
        gameTime: {
          ...gameState.gameTime,
          elapsedTime: game?.elapsedTime ?? 0,
        },
        locations: franchises,
      }));
    }

    loadGameData();
  }, []);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<leaflet.Map>(null);
  const clickRef = useRef<leaflet.Marker<any>>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Store the layer references
  const countyLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const stateLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const gameStateRef = useRef(gameState);
  const franchiseMarkersRef = useRef<leaflet.Marker[]>([]);
  const locationCircleRef = useRef<leaflet.Circle | null>(null);

  // Helper function to check if a location is within any county boundary
  const checkIfLocationInUSA = (lat: number, lng: number): boolean => {
    if (!countyLayerRef.current && !stateLayerRef.current) {
      return true; // If county layer not loaded, allow placement (fail open)
    }

    let geoBoundary: leaflet.GeoJSON | null;
    if (boundaryType === 'counties') {
      geoBoundary = countyLayerRef.current;
    } else {
      geoBoundary = stateLayerRef.current;
    }

    if (!geoBoundary) return false;

    let isInUSA = false;
    // Check each county layer to see if the point is within its boundaries
    geoBoundary.eachLayer((layer: any) => {
      if (layer.feature && layer.feature.geometry) {
        const point = leaflet.latLng(lat, lng);

        // Check if point is within the bounding box of any county
        if (layer.getBounds && layer.getBounds().contains(point)) {
          isInUSA = true;
        }
      }
    });
    return isInUSA;
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = map(mapRef.current, {
      minZoom: 4,
      maxZoom: 18,
      maxBounds: [
        [20, -130], // Southwest corner (south of US, west of US)
        [50, -60], // Northeast corner (north of US, east of US)
      ],
      maxBoundsViscosity: 1.0,
    }).setView([39.8283, -98.5795], 4);


    mapInstance.current.on('click', e => {
      // Check if the click is within any county boundary
      const isInUSA = checkIfLocationInUSA(e.latlng.lat, e.latlng.lng);

      if (!isInUSA) {
        showToast('Location must be in the United States', 'warning');
        return;
      }
      setClickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    const loadCountiesWrapper = async () => {
      if (!mapInstance.current) {
        return;
      }

      await loadCounties({
        mapInstance: mapInstance.current,
        onSuccess: layer => {
          countyLayerRef.current = layer;
        },
      });
    };

    const loadStatesWrapper = async () => {
      if (!mapInstance.current) {
        return;
      }

      await loadStates({
        mapInstance: mapInstance.current,
        onSuccess: layer => {
          stateLayerRef.current = layer;
        },
        onError: () => {},
      });
    };

    // Load initial boundary type (counties by default)
    if (boundaryType === 'counties') {
      loadCountiesWrapper();
    } else {
      loadStatesWrapper();
    }

    return () => {
      if (countyLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(countyLayerRef.current);
      }
      if (stateLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(stateLayerRef.current);
      }
    };
  }, [boundaryType]); // No dependencies - only run once

  // Update franchise markers when franchises change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing franchise markers
    franchiseMarkersRef.current.forEach(marker => {
      if (mapInstance.current) {
        mapInstance.current.removeLayer(marker);
      }
    });
    franchiseMarkersRef.current = [];
    // Add new franchise markers
    locations.forEach(franchise => {
      if (!user) return; // Skip if no user is available

      const franchiseColor = getFranchiseColor(franchise, userColors);
      const franchiseIcon = createFranchiseIcon(franchiseColor, franchise.locationType);

      const franchiseMarker = marker([franchise.lat, franchise.long], {
        icon: franchiseIcon,
      }).on('click', () => {
        selectLocation(franchise);
      });

      if (mapInstance.current) {
        franchiseMarker.addTo(mapInstance.current);
        franchiseMarkersRef.current.push(franchiseMarker);
      }
    });

  }, [locations, userColors, user]);

  useEffect(() => {
    const clickedLocation = gameState.clickedLocation;
    if (!clickedLocation || !mapInstance.current) return;

    const franchiseIcon = createFranchiseIcon(undefined, placementMode);

    const franchiseMarker = marker([clickedLocation.lat, clickedLocation.lng], {
      icon: franchiseIcon,
    });

    clickRef.current?.removeFrom(mapInstance.current);
    franchiseMarker.addTo(mapInstance.current);
    clickRef.current = franchiseMarker;

    // Remove existing circle if any
    if (locationCircleRef.current) {
      mapInstance.current.removeLayer(locationCircleRef.current);
      locationCircleRef.current = null;
    }

    // Set radius based on location type
    let radiusInMeters;
    if (placementMode === 'distribution-center') {
      // Convert 500 miles to meters (1 mile = 1609.34 meters)
      radiusInMeters = 500 * 1609.34;
    } else {
      // Use default radius for franchise (5 miles = 8047 meters)
      radiusInMeters = GAME_DEFAULTS.DEFAULT_RADIUS_METERS;
    }


    // Create preview circle with a slightly different style to indicate it's a preview
    const previewCircle = circle([clickedLocation.lat, clickedLocation.lng], {
      radius: radiusInMeters,
      color: '#3b82f6', // Blue color for preview
      fillColor: '#3b82f6',
      fillOpacity: 0.2, // Increase from 0.05
      opacity: 0.8, // Increase from 0.3
      weight: 3, // Increase from 2
      dashArray: '5, 5', // Dashed line to indicate preview
    });

    previewCircle.addTo(mapInstance.current);
    locationCircleRef.current = previewCircle;
  }, [gameState.clickedLocation, placementMode]);

  // Handle radius circle for selected franchises
  useEffect(() => {
    if (!mapInstance.current) return;

    const selectedLocation = gameState.selectedLocation;
    const clickedLocation = gameState.clickedLocation;

    if (
      selectedLocation &&
      (selectedLocation.locationType === 'distribution-center' ||
        selectedLocation.locationType === 'franchise') &&
      !clickedLocation
    ) {
      // Remove existing circle if any
      if (locationCircleRef.current) {
        mapInstance.current.removeLayer(locationCircleRef.current);
        locationCircleRef.current = null;
      }

      // Get owner's color
      const ownerColor = userColors.get(selectedLocation.userId) || '#3b82f6'; // Default blue

      // Set radius based on location type
      let radiusInMeters;
      if (selectedLocation.locationType === 'distribution-center') {
        // Convert 500 miles to meters (1 mile = 1609.34 meters)
        radiusInMeters = 500 * 1609.34;
      } else {
        // Use default radius for franchise (5 miles = 8047 meters)
        radiusInMeters = GAME_DEFAULTS.DEFAULT_RADIUS_METERS;
      }

      // Create circle
      const selectionCircle = circle([selectedLocation.lat, selectedLocation.long], {
        radius: radiusInMeters,
        color: ownerColor,
        fillColor: ownerColor,
        fillOpacity: 0.1,
        opacity: 0.4,
        weight: 2,
      });

      selectionCircle.addTo(mapInstance.current);
      locationCircleRef.current = selectionCircle;
    } else if (!clickedLocation) {
      // Remove circle if no selected location and no clicked location
      if (locationCircleRef.current) {
        mapInstance.current.removeLayer(locationCircleRef.current);
        locationCircleRef.current = null;
      }
    }
  }, [gameState.selectedLocation, gameState.clickedLocation, userColors, placementMode]);

  // Update map style
  useEffect(() => {
    if (mapInstance.current == null || !leaflet) return;

    mapInstance.current.eachLayer(layer => {
      if (layer instanceof leaflet.TileLayer && mapInstance.current) {
        mapInstance.current.removeLayer(layer);
      }
    });

    leaflet
      .tileLayer(mapStyles[mapControls.style], {
        attribution: getAttribution(mapControls.style),
      })
      .addTo(mapInstance.current);
  }, [mapControls.style]);

  // Update zoom
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setZoom(mapControls.zoom);
  }, [mapControls.zoom]);

  // Cleanup effect for location circle
  useEffect(() => {
    return () => {
      if (locationCircleRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(locationCircleRef.current);
        locationCircleRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="fixed top-16 left-0 right-0 bottom-0 z-[1]"
      style={{ height: 'calc(100vh - 64px)' }}
      data-testid={DataTestIDs.GAME_MAP}
    >
      {' '}
    </div>
  );
};

export default GameMap;
