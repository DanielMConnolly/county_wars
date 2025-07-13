import React from 'react';
import { MapControls, MapStyle, BoundaryType } from './types/GameTypes';

const MapControlsComponent = ({
  mapControls,
  onChangeMapStyle,
  onChangeBoundaryType,
}: {
  mapControls: MapControls;
  onChangeMapStyle: (_arg: MapStyle) => void;
  onChangeBoundaryType: (arg: BoundaryType) => void;
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
            Boundaries
          </label>
          <select
            value={mapControls.boundaryType}
            onChange={(e) => onChangeBoundaryType(e.target.value as BoundaryType)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white
             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="counties">Counties</option>
            <option value="states">States</option>
          </select>
        </div>
      </div>

    </div>
  );
};

export default MapControlsComponent;
