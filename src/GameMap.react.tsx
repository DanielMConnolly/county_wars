import { useContext, useEffect, useRef, useState } from "react";
import { mapStyles, getAttribution } from "./data/mapStyles";
import {
  map,
  Polyline,
  Layer,
  marker,
  divIcon,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { GameStateContext } from "./GameStateContext";
import { MapControls } from "./types/GameTypes";
import React from 'react';
import { DataTestIDs } from "./DataTestIDs";
import { fetchGameTime, getGameFranchises } from "./api_calls/CountyWarsHTTPRequests";
import { getCurrentGameId } from "./utils/gameUrl";

const defaultStyle = {
  fillColor: "#3388ff",
  weight: 1,
  opacity: 1,
  color: "white",
  fillOpacity: 0.3,
};

const highlightStyle = {
  fillColor: "#ff7800",
  weight: 3,
  opacity: 1,
  color: "#666",
  fillOpacity: 0.7,
};



const GameMap = ({ mapControls }: { mapControls: MapControls }): React.ReactNode => {
  const { gameState, selectCounty, setClickedLocation, setGameState } = useContext(GameStateContext);
  const gameID = getCurrentGameId();

  useEffect(() => {

    async function loadFranchiseData() {
      const franchises = (await getGameFranchises(gameID)).franchises;

      const elapsedTime = await fetchGameTime(gameID);
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

    loadFranchiseData();

  }, []);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<leaflet.Map>(null);

  const [_, setCurrentHighlighted] = useState<Polyline | null>(null);
  const [isCountyLayerLoaded, setIsCountyLayerLoaded] = useState<boolean>(false);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);




  // Store the county layer reference
  const countyLayerRef = useRef<leaflet.GeoJSON | null>(null);
  const gameStateRef = useRef(gameState);
  const franchiseMarkersRef = useRef<leaflet.Marker[]>([]);

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Initializing map...');

    if (mapRef.current != null) {
      mapInstance.current = map(mapRef.current).setView([39.8283, -98.5795], 4);

      // Add click handler for the map itself (not just counties)
      mapInstance.current.on('click', (e) => {
        console.log('🗺️ Map clicked at:', e.latlng);
        setClickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    const loadCounties = async () => {
      try {
        console.log('🗺️ Starting county layer initialization...');
        console.log('📡 Fetching counties.geojson...');

        const response = await fetch("/counties.geojson");

        if (!response.ok) {
          throw new Error(`Failed to fetch counties: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Counties data loaded successfully');
        console.log(`📊 Counties data contains ${data.features ? data.features.length : 0} features`);

        const layer = leaflet.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function (feature, layer: Polyline) {
            layer.on("click", () => {
              console.log('🖱️ County clicked:', feature.properties?.NAME);

              setCurrentHighlighted(prevLayer => {
                  prevLayer?.setStyle(defaultStyle);
                return layer;
              });

              // Apply selection highlight to the newly selected county
              layer.setStyle(highlightStyle);
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
          console.log('🎯 County layer successfully added to map!');
          console.log('📍 Map bounds:', mapInstance.current.getBounds());
          setIsCountyLayerLoaded(true);
        } else {
          console.error('❌ Map instance not available when trying to add county layer');
          setIsCountyLayerLoaded(false);
        }
      } catch (error) {
        console.error("❌ Error loading counties:", error);
        setIsCountyLayerLoaded(false);
      }
    };

    loadCounties();

    return () => {
      console.log('Cleaning up map...');
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

      const franchiseIcon = divIcon({
        className: 'franchise-marker',
        html: `<div style="
          background: ${gameState.highlightColor};
          border: 2px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            background: white;
            border-radius: 50%;
            width: 8px;
            height: 8px;
          "></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const franchiseMarker = marker([franchise.lat, franchise.long], {
        icon: franchiseIcon
      }).bindPopup(`
        <div style="font-size: 14px;">
          <strong>${franchise.name}</strong><br>
          <small>Placed: ${new Date(franchise.placedAt).toLocaleString()}</small>
        </div>
      `);

      if (mapInstance.current) {
        franchiseMarker.addTo(mapInstance.current);
        franchiseMarkersRef.current.push(franchiseMarker);
      }
    });

    console.log(`Updated ${gameState.franchises.length} franchise markers`);
  }, [gameState.franchises, gameState.highlightColor]);

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
