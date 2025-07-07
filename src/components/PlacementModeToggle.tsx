import React from 'react';
import { Building2, Warehouse } from 'lucide-react';
import { useGameState } from '../GameStateContext';

const PlacementModeToggle: React.FC = () => {
  const { placementMode, onPlacementModeChange } = useGameState();
  return (
    <div className="fixed bottom-6 left-6 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 z-[1000] border border-slate-600 shadow-xl">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 text-center">Placement Mode</h3>

        <div className="flex flex-col space-y-2">
          {/* Franchise Option */}
          <button
            onClick={() => onPlacementModeChange('franchise')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              placementMode === 'franchise'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Franchise</span>
          </button>

          {/* Distribution Center Option */}
          <button
            onClick={() => onPlacementModeChange('distribution-center')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              placementMode === 'distribution-center'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <Warehouse className="w-5 h-5" />
            <span className="font-medium">Distribution Center</span>
          </button>
        </div>

        {/* Current mode indicator */}
        <div className="text-xs text-center text-gray-400 pt-2 border-t border-slate-600">
          Current: {placementMode === 'franchise' ? 'Franchise' : 'Distribution Center'}
        </div>
      </div>
    </div>
  );
};

export default PlacementModeToggle;
