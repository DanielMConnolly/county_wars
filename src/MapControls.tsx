import React from 'react';
import { MapControls, MapStyle } from './types/GameTypes';

const MapControlsComponent = ({
  mapControls,
  onChangeMapStyle,
  onUpdateZoom,
}: {
  mapControls: MapControls;
  onChangeMapStyle: (_arg: MapStyle) => void;
  onUpdateZoom: (arg: number) => void;
}) => {
  return (
    <div
      className="fixed top-20 left-6 bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl z-[1000] border
       border-slate-600 shadow-xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Map Style
          </label>
          <select
            value={mapControls.style}
            onChange={(e) => onChangeMapStyle(e.target.value as MapStyle)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white
             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="terrain">Terrain</option>
            <option value="satellite">Satellite</option>
            <option value="dark">Dark Mode</option>
            <option value="street">Street</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Zoom Level: {mapControls.zoom}
          </label>
          <input
            type="range"
            min="3"
            max="18"
            value={mapControls.zoom}
            onChange={(e) => onUpdateZoom(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
      `}</style>
    </div>
  );
};

export default MapControlsComponent;
