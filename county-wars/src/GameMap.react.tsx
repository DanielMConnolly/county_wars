import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { mapStyles, getAttribution } from "./data/mapStyles";
import {
  map,
  Polyline,
  Layer,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { GameStateContext } from "./GameStateContext";
import { useIsCountyOwned } from "./utils/gameUtils";
import { GameDifficulty, MapControls } from "./types/GameTypes";
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

  // eslint-disable-next-line no-undef
  const mapRef = useRef<HTMLDivElement|null>(null);
  const mapInstance = useRef<leaflet.Map>(null);

  const [currentHighlighted, setCurrentHighlighted] = useState<Polyline | null>(null);
  const [isCountyLayerLoaded, setIsCountyLayerLoaded] = useState<boolean>(false);

  const handleTileClick = useCallback((layer: Polyline) => {
    setCurrentHighlighted(prevLayer => {
      if (!prevLayer) return layer;
      
      // Reset the previously highlighted county to its correct style
      const prevLayerCounty = {
        name: prevLayer?.feature?.properties.NAME as string,
        state: prevLayer?.feature?.properties.STATEFP as string,
        pop: 10000 as number,
        difficulty: "Hard" as GameDifficulty,
      }
      const countyId = prevLayerCounty.name + prevLayerCounty.state;
      
      if (gameState.ownedCounties.has(countyId)) {
        // If the previous county is owned, set it back to owned style
        const ownedStyle = {
          ...highlightStyle,
          fillColor: gameState.highlightColor
        };
        prevLayer?.setStyle(ownedStyle);
      } else {
        // If not owned, set it back to default style
        prevLayer?.setStyle(defaultStyle);
      }
      
      return layer;
    });
    
    // Apply selection highlight to the newly selected county
    layer.setStyle(highlightStyle);
    
    selectCounty({
      name: layer.feature?.properties.NAME,
      pop: 10000,
      difficulty: 'Easy',
      state: layer.feature?.properties.STATEFP,
    });
  }, [gameState.ownedCounties, selectCounty]);


  // Store the county layer reference
  const countyLayerRef = useRef<leaflet.GeoJSON | null>(null);

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    if (mapRef.current != null) {
      mapInstance.current = map(mapRef.current).setView([39.8283, -98.5795], 4);
    }

    fetch("counties.geojson")
      .then((response) => response.json())
      .then((data) => {
        const layer = leaflet.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function (feature, layer: Polyline) {
            layer.on("click", () => handleTileClick(layer));
            layer.on("mouseover", function () {
            });
            layer.on("mouseout", function () {
            });
          },
        });

        countyLayerRef.current = layer;

        if (mapInstance.current) {
          layer.addTo(mapInstance.current);
          
          // Mark county layer as loaded
          console.log('County layer loaded and added to map');
          setIsCountyLayerLoaded(true);
        }
      })
      .catch((error) => console.error("Error loading counties:", error));

    return () => {
      if (countyLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(countyLayerRef.current);
      }
    };
  }, []); // No dependencies - initialize only once


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

      const countyId = layer.feature?.properties.NAME + layer.feature?.properties.STATEFP;

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
    > </div>
  );
};

export default GameMap;
