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
import { fetchGameTime, getGameFranchises } from "./api_calls/CountyWarsHTTPRequests";
import { getCurrentGameId } from "./utils/gameUrl";
import { createFranchiseIcon } from "./FranchiseIcon";
import { useAuth } from "./auth/AuthContext";
import { getFranchiseColor } from "./utils/colorUtils";
import { useToast } from "./Toast/ToastContext";
import { createFranchisePopupHTML, createClickLocationPopupHTML } from "./components/FranchisePopup";

const defaultStyle = {
  fillColor: "#3388ff",
  weight: 1,
  opacity: 1,
  color: "white",
  fillOpacity: 0.3,
};



const GameMap = ({ mapControls }: { mapControls: MapControls }): React.ReactNode => {
  const { gameState, selectCounty, selectFranchise, setClickedLocation, setGameState } = useContext(GameStateContext);
  const { user } = useAuth();
  const { showToast } = useToast();
  const gameID = getCurrentGameId();

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
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);




  // Store the county layer reference
  const countyLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const gameStateRef = useRef(gameState);
  const franchiseMarkersRef = useRef<leaflet.Marker[]>([]);

  // Helper function to check if a location is within any county boundary
  const checkIfLocationInCounty = (lat: number, lng: number): boolean => {
    if (!countyLayerRef.current) {
      return true; // If county layer not loaded, allow placement (fail open)
    }

    let isInCounty = false;

    // Check each county layer to see if the point is within its boundaries
    countyLayerRef.current.eachLayer((layer: any) => {
      if (!isInCounty && layer.feature && layer.feature.geometry) {
        const point = leaflet.latLng(lat, lng);

        // Check if point is within the bounding box of any county
        if (layer.getBounds && layer.getBounds().contains(point)) {
          isInCounty = true;
        }
      }
    });

    return isInCounty;
  };

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Initializing map...');

    if (mapRef.current != null) {
      mapInstance.current = map(mapRef.current, {
        minZoom: 4,
        maxZoom: 18,
        maxBounds: [
          [20, -130], // Southwest corner (south of US, west of US)
          [50, -60]   // Northeast corner (north of US, east of US)
        ],
        maxBoundsViscosity: 1.0
      }).setView([39.8283, -98.5795], 4);

      // Add click handler for the map itself (not just counties)
      mapInstance.current.on('click', (e) => {

        // Check if the click is within any county boundary
        const isInCounty = checkIfLocationInCounty(e.latlng.lat, e.latlng.lng);

        if (!isInCounty) {
          showToast('Location must be in the United States', 'warning');
          return;
        }

        setClickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    const loadCounties = async () => {
      try {
        const response = await fetch("/counties.geojson");

        if (!response.ok) {
          throw new Error(`Failed to fetch counties: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const layer = leaflet.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function (feature, layer: Polyline) {
            layer.on("click", () => {
              selectCounty(
                {
                  name: layer.feature?.properties.NAME,
                  stateFP: layer.feature?.properties.STATEFP,
                  countyFP: layer.feature?.properties.COUNTYFP,
                }
              );
            });
            layer.on("mouseover", function () {
              // Optional hover effects can be added here
            });
            layer.on("mouseout", function () {
              // Optional hover effects can be added here
            });
          },
        });

        countyLayerRef.current = layer;

        if (mapInstance.current) {
          layer.addTo(mapInstance.current);
          setIsCountyLayerLoaded(true);
        } else {
          setIsCountyLayerLoaded(false);
        }
      } catch (_error) {
        setIsCountyLayerLoaded(false);
      }
    };

    loadCounties();

    return () => {
      if (countyLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(countyLayerRef.current);
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // No dependencies - only run once


  // Update county styling when ownership or colors change
  useEffect(() => {
    if (!countyLayerRef.current || !isCountyLayerLoaded) {
      console.log('County layer not ready yet, skipping style update. Layer loaded:', isCountyLayerLoaded);
      return;
    }

    let styledCount = 0;
    countyLayerRef.current.eachLayer((layer: Layer) => {
      if (!(layer instanceof Polyline)) return;

      layer.setStyle(defaultStyle);

    });

    console.log(`Styled ${styledCount} owned counties`);
  }, [gameState.highlightColor, isCountyLayerLoaded]);

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

      const isOwnedByUser = franchise.userId === user.id;

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
    }).bindPopup(createClickLocationPopupHTML({
      locationName: 'Selected Location',
      dateTime: new Date().toLocaleString()
    }));


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
