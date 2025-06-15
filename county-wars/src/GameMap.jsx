import React, { useEffect, useRef } from 'react';
import { sampleCounties } from '../../county-conquest-game/src/data/counties';
import { mapStyles, getAttribution } from '../../county-conquest-game/src/data/mapStyles';

const GameMap = ({ gameState, mapControls, onSelectCounty }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      mapInstance.current = window.L.map(mapRef.current).setView([39.8283, -98.5795], 4);

      const tileLayer = window.L.tileLayer(mapStyles.terrain, {
        attribution: getAttribution('terrain')
      }).addTo(mapInstance.current);

      addCountyMarkers();
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    mapInstance.current.eachLayer(layer => {
      if (layer instanceof window.L.TileLayer) {
        mapInstance.current.removeLayer(layer);
      }
    });

    window.L.tileLayer(mapStyles[mapControls.style], {
      attribution: getAttribution(mapControls.style)
    }).addTo(mapInstance.current);
  }, [mapControls.style]);

  // Update zoom
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setZoom(mapControls.zoom);
  }, [mapControls.zoom]);

  const addCountyMarkers = () => {
    if (!mapInstance.current || !window.L) return;

    markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
    markersRef.current = [];

    sampleCounties.forEach(county => {
      const marker = window.L.marker([county.lat, county.lng])
        .addTo(mapInstance.current)
        .bindPopup(`<div class="text-gray-800"><b>${county.name}</b><br/>Population: ${county.pop.toLocaleString()}</div>`)
        .on('click', () => onSelectCounty(county));

      markersRef.current.push(marker);
    });
  };

  return (
    <div
      ref={mapRef}
      className="fixed top-16 left-0 right-0 bottom-0 z-[1]"
      style={{ height: 'calc(100vh - 64px)' }}
    />
  );
};

export default GameMap;
