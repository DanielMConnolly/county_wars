import  { useContext, useEffect, useRef, useState } from "react";
import { mapStyles, getAttribution } from "./data/mapStyles";
import {
  map,
  ImageOverlay,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { GameStateContext } from "./GameStateContext";

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



const GameMap= ({mapControls }) => {

  const { gameState, selectCounty } = useContext(GameStateContext);
  console.log(gameState);
  const mapRef = useRef<string | HTMLElement>(null);
  const mapInstance = useRef<leaflet.Map>(null);

  let currentHighlighted: ImageOverlay | null = null; // Track currently highlighted county

  // Initialize map
  useEffect(() => {
    const highlightStyles = highlightStyle;
    highlightStyles.fillColor = gameState.highlightColor;
    if (!mapRef.current || mapInstance.current) return;

    if (mapRef.current != null) {
      mapInstance.current = map(mapRef.current).setView([39.8283, -98.5795], 4);
    }

    fetch("counties.geojson")
      .then((response) => response.json())
      .then((data) => {
        const layer = leaflet.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function (feature, layer: ImageOverlay) {
            if(layer.feature.properties.NAME in gameState.ownedCounties) {
              highlightCounty(layer)
            }
            // Add click event to each county
            layer.on("click", function (e) {
              highlightCounty(layer);
             selectCounty({
                name: feature.properties.NAME,
                pop: 10000,
                difficulty: 1,
              });
            });

            layer.on("mouseover", function (e) {

            });

            layer.on("mouseout", function (e) {

            });
          },
        });
        if (mapInstance.current) {
          layer.addTo(mapInstance.current);
        }
      })
      .catch((error) => console.error("Error loading counties:", error));

    function highlightCounty(layer: ImageOverlay) {

      // Highlight the clicked county
      layer.setStyle(highlightStyle);
      currentHighlighted = layer;

      // Optional: Get county information
      const countyName = layer.feature.properties.NAME || "Unknown";
      const stateName = layer.feature.properties.STATE_NAME || "Unknown";
      console.log(`Selected: ${countyName}, ${stateName}`);
    }

    return () => {

    };
  }, []);


  useEffect(() => {
    function highlightCounty(layer: ImageOverlay) {

      // Highlight the clicked county
      layer.setStyle(highlightStyle);
      currentHighlighted = layer;
    }
    mapInstance.current.eachLayer((layer: ImageOverlay)=> {
      if(!layer.feature) return;
      if(gameState.ownedCounties.has(layer.feature.properties.NAME)) {
        highlightCounty(layer)
      }

    });
  }, [gameState.highlightColor, gameState.ownedCounties]);

  // Update map style
  useEffect(() => {
    if (mapInstance.current == null || !leaflet) return;

    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof leaflet.TileLayer) {
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
  }, []);

  return (
    <div
      ref={mapRef}
      className="fixed top-16 left-0 right-0 bottom-0 z-[1]"
      style={{ height: "calc(100vh - 64px)" }}
    ></div>
  );
};

export default GameMap;
