import { useContext, useEffect, useRef, useState } from "react";
import { mapStyles, getAttribution } from "./data/mapStyles";
import {
  map,
  Polyline,
  Layer,
  marker,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { GameStateContext } from "./GameStateContext";
import { MapControls } from "./types/GameTypes";
import React from 'react';
import { DataTestIDs } from "./DataTestIDs";
import { fetchGameTime, getGameFranchises } from "./api_calls/HTTPRequests";
import { getCurrentGameId } from "./utils/gameUrl";
import { createFranchiseIcon } from "./FranchiseIcon";
import { useAuth } from "./auth/AuthContext";
import { getFranchiseColor } from "./utils/colorUtils";
import { useToast } from "./Toast/ToastContext";
import { loadCounties, loadStates } from "./GameMapHelper";






const GameMap = ({ mapControls }: { mapControls: MapControls }): React.ReactNode => {
  const { gameState,selectFranchise, setClickedLocation, setGameState } = useContext(GameStateContext);
  const { user } = useAuth();

  const { showToast } = useToast();
  const gameID = getCurrentGameId();

  const { boundaryType } = mapControls;

  // Assert that gameID is non-null
  if (!gameID) {
    throw new Error('GameMap: gameID cannot be null. Ensure the component is used within a valid game context.');
  }

  // TypeScript assertion: gameID is guaranteed to be non-null after the check above
  const gameId: string = gameID;

  useEffect(() => {
    async function loadGameData() {
      const franchises = (await getGameFranchises(gameId)).franchises;
      const elapsedTime = await fetchGameTime(gameId);
      if (franchises == null) return;
      setGameState(gameState => ({
        ...gameState,
        gameTime: {
          ...gameState.gameTime,
          elapsedTime: elapsedTime ?? 0,
        },
        franchises: franchises
      }));
    }

    loadGameData();
  }, []);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<leaflet.Map>(null);
  const clickRef = useRef<leaflet.Marker<any>>(null);

  const [isCountyLayerLoaded, setIsCountyLayerLoaded] = useState<boolean>(false);
  const [isStateLayerLoaded, setIsStateLayerLoaded] = useState<boolean>(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Store the layer references
  const countyLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const stateLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const gameStateRef = useRef(gameState);
  const franchiseMarkersRef = useRef<leaflet.Marker[]>([]);

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
          isInUSA= true;
        }
      }
    });
    return isInUSA;
  };

  useEffect(() => {
    if(!mapRef.current || mapInstance.current) return;
      mapInstance.current = map(mapRef.current, {
        minZoom: 4,
        maxZoom: 18,
        maxBounds: [
          [20, -130], // Southwest corner (south of US, west of US)
          [50, -60]   // Northeast corner (north of US, east of US)
        ],
        maxBoundsViscosity: 1.0
      }).setView([39.8283, -98.5795], 4);

    mapInstance.current.on('click', (e) => {
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
        setIsCountyLayerLoaded(false);
        return;
      }


      await loadCounties({
        mapInstance: mapInstance.current,
        onSuccess: (layer) => {
          countyLayerRef.current = layer;
          setIsCountyLayerLoaded(true);
        },
      });
    };

    const loadStatesWrapper = async () => {
      if (!mapInstance.current) {
        setIsStateLayerLoaded(false);
        return;
      }

      await loadStates({
        mapInstance: mapInstance.current,
        onSuccess: (layer) => {
          stateLayerRef.current = layer;
          setIsStateLayerLoaded(true);
        },
        onError: () => {
          setIsStateLayerLoaded(false);
        }
      });
    };

    // Load initial boundary type (counties by default)
    if (boundaryType === 'counties') {
      console.log('Loading counties');
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
    gameState.franchises.forEach(franchise => {
      if (!user) return; // Skip if no user is available

      const franchiseColor = getFranchiseColor(franchise, user.id, gameState.highlightColor, gameState.franchises);
      const franchiseIcon = createFranchiseIcon(franchiseColor);

      const franchiseMarker = marker([franchise.lat, franchise.long], {
        icon: franchiseIcon
      }).on('click', () => {
        selectFranchise(franchise);
      });

      if (mapInstance.current) {
        franchiseMarker.addTo(mapInstance.current);
        franchiseMarkersRef.current.push(franchiseMarker);
      }
    });

    console.log(`Updated ${gameState.franchises.length} franchise markers`);
  }, [gameState.franchises, gameState.highlightColor, user]);

  useEffect(() => {

    const clickedLocation = gameState.clickedLocation;

    if (!clickedLocation) return;
    console.log('Clicked location:', clickedLocation);
    const franchiseIcon = createFranchiseIcon();

    const franchiseMarker = marker([clickedLocation.lat, clickedLocation.lng], {
      icon: franchiseIcon
    });


    if (mapInstance.current) {
      clickRef.current?.removeFrom(mapInstance.current);
      franchiseMarker.addTo(mapInstance.current);
      clickRef.current = franchiseMarker;
    }

  }, [gameState.clickedLocation]);

  // Update map style
  useEffect(() => {
    if (mapInstance.current == null || !leaflet) return;

    mapInstance.current.eachLayer((layer) => {
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

  return (
    <div
      ref={mapRef}
      className="fixed top-16 left-0 right-0 bottom-0 z-[1]"
      style={{ height: "calc(100vh - 64px)" }}
      data-testid={DataTestIDs.GAME_MAP}
    > </div>
  );
};

export default GameMap;
