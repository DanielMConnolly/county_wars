import { useContext, useEffect, useRef, useState } from "react";
import { mapStyles, getAttribution } from "./data/mapStyles";
import {
  map,
  Polyline,
  Layer,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { GameStateContext } from "./GameStateContext";
import { MapControls } from "./types/GameTypes";
import React from 'react';

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
  const { gameState, selectCounty } = useContext(GameStateContext);

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

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Initializing map...');
    
    if (mapRef.current != null) {
      mapInstance.current = map(mapRef.current).setView([39.8283, -98.5795], 4);
    }

    const loadCounties = async () => {
      try {
        console.log('Fetching counties.geojson...');
        const response = await fetch("counties.geojson");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch counties: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Counties data loaded, creating layer...');

        const layer = leaflet.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function (feature, layer: Polyline) {
            layer.on("click", () => {
              setCurrentHighlighted(prevLayer => {
                if (!prevLayer) return layer;
                const countyId = prevLayer?.feature?.properties.COUNTYFP + prevLayer?.feature?.properties.STATEFP;
                if (gameStateRef.current.ownedCounties.has(countyId)) {
                  prevLayer?.setStyle({
                    ...highlightStyle,
                   fillColor: gameStateRef.current.highlightColor,
                 });
                } else {
                  prevLayer?.setStyle(defaultStyle);
                }
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
          console.log('County layer loaded and added to map successfully');
          setIsCountyLayerLoaded(true);
        } else {
          console.error('Map instance not available when trying to add county layer');
        }
      } catch (error) {
        console.error("Error loading counties:", error);
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

    console.log('Updating county styles. Owned counties:', Array.from(gameState.ownedCounties));

    const updatedHighlightStyle = {
      ...highlightStyle,
      fillColor: gameState.highlightColor
    };

    let styledCount = 0;
    countyLayerRef.current.eachLayer((layer: Layer) => {
      if (!(layer instanceof Polyline)) return;

      const countyId = layer.feature?.properties.COUNTYFP + layer.feature?.properties.STATEFP;

      if (gameState.ownedCounties.has(countyId)) {
        layer.setStyle(updatedHighlightStyle);
        styledCount++;
      } else {
        layer.setStyle(defaultStyle);
      }
    });

    console.log(`Styled ${styledCount} owned counties`);
  }, [gameState.highlightColor, gameState.ownedCounties, isCountyLayerLoaded]);

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
      data-testid="game-map"
    > </div>
  );
};

export default GameMap;
