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
  if (currentHighlighted != null) {
    currentHighlighted.setStyle(highlightStyle);
  }

  const handleTileClick = useCallback((layer: Polyline) => {
    setCurrentHighlighted(prevLayer => {
      if (!prevLayer) return layer;
      const prevLayerCounty = {
        name: prevLayer?.feature?.properties.NAME as string,
        state: prevLayer?.feature?.properties.STATEFP as string,
        pop: 10000 as number,
        difficulty: "Hard" as GameDifficulty,
      }
      const countyId = prevLayerCounty.name + prevLayerCounty.state;
      if (!gameState.ownedCounties.has(countyId)) {
        prevLayer?.setStyle(defaultStyle);
      }
      return layer;
    });
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
            // Add click event to each county
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
    if (!countyLayerRef.current) return;

    const updatedHighlightStyle = {
      ...highlightStyle,
      fillColor: gameState.highlightColor
    };

    countyLayerRef.current.eachLayer((layer: Layer) => {
      if (!(layer instanceof Polyline)) return;

      const countyId = layer.feature?.properties.NAME + layer.feature?.properties.STATEFP;

      if (gameState.ownedCounties.has(countyId)) {
        layer.setStyle(updatedHighlightStyle);
      } else {
        layer.setStyle(defaultStyle);
      }
    });
  }, [gameState.highlightColor, gameState.ownedCounties]);

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
