import React, { useState } from 'react';
import { Package, Filter } from 'lucide-react';
import { GameState, PlacedLocation } from '../types/GameTypes';
import LocationInfoCard from '../components/LocationListCard';
import { Dropdown, DropdownOption } from '../components/Dropdown';

interface DistributionCenterListProps {
  userDistributionCenters: PlacedLocation[];
  gameState: GameState;
}

export default function DistributionCenterList({
  userDistributionCenters,
}: DistributionCenterListProps) {
  const [selectedState, setSelectedState] = useState<string>('all');

  // Get unique states for filtering
  const uniqueStates = Array.from(
    new Set(userDistributionCenters.map(dc => dc.state).filter(Boolean))
  ) as string[];

  // Create dropdown options
  const stateOptions: DropdownOption[] = [
    { value: 'all', label: `All States (${userDistributionCenters.length})` },
    ...uniqueStates.map(state => {
      const count = userDistributionCenters.filter(dc => dc.state === state).length;
      return { value: state, label: `${state} (${count})` };
    })
  ];

  // Filter distribution centers by selected state
  const filteredDistributionCenters =
    selectedState === 'all'
      ? userDistributionCenters
      : userDistributionCenters.filter(dc => dc.state === selectedState);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Your Distribution Centers</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {filteredDistributionCenters.length} locations
        </span>
      </div>

      {/* State Filter */}
      {uniqueStates.length > 0 && (
        <Dropdown
          value={selectedState}
          onChange={(value) => setSelectedState(value as string)}
          options={stateOptions}
          label="Filter by State:"
          icon={<Filter size={16} className="text-gray-500" />}
          className="max-w-xs"
        />
      )}

      {filteredDistributionCenters.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredDistributionCenters.map(distributionCenter => (
            <LocationInfoCard key={distributionCenter.id} location={distributionCenter} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Distribution Centers Yet</h4>
          <p className="text-gray-500">
            Switch to distribution center mode and click on the map to place your first distribution
            center!
          </p>
        </div>
      )}
    </div>
  );
}
