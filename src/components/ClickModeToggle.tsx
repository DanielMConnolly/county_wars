import React from 'react';
import { Building2, Warehouse, Search } from 'lucide-react';
import { useGameState } from '../GameStateContext';

const ClickModeToggle: React.FC = () => {
  const { placementMode, onPlacementModeChange } = useGameState();
  return (
    <div className="fixed bottom-6 left-6 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 z-[1000] border border-slate-600 shadow-xl">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 text-center">Click Mode</h3>

        <div className="space-y-2">
          {/* Franchise and Distribution Center - Horizontal Row */}
          <div className="flex space-x-2">
            {/* Franchise Option */}
            <button
              onClick={() => onPlacementModeChange('franchise')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-1 justify-center ${
                placementMode === 'franchise'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-sm">Franchise</span>
            </button>

            {/* Distribution Center Option */}
            <button
              onClick={() => onPlacementModeChange('distribution-center')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-1 justify-center ${
                placementMode === 'distribution-center'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              <span className="font-medium text-sm">Dist. Center</span>
            </button>
          </div>

          {/* Explore Option - Full Width Below */}
          <button
            onClick={() => onPlacementModeChange('explore')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full justify-center ${
              placementMode === 'explore'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Explore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickModeToggle;
