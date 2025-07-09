import React, { useState } from 'react';
import { UtensilsCrossed, Filter } from 'lucide-react';
import { GameState, Franchise } from '../types/GameTypes';
import LocationInfoCard from '../components/LocationListCard';

interface FranchiseIncomeData {
  id: string;
  name: string;
  income: number;
}

interface FranchiseListProps {
  userFranchises: Franchise[];
  gameState: GameState;
  franchiseIncomeData?: FranchiseIncomeData[];
}

export default function FranchiseList({ userFranchises, franchiseIncomeData }: FranchiseListProps) {
  const [selectedState, setSelectedState] = useState<string>('all');

  // Get unique states for filtering
  const uniqueStates = Array.from(
    new Set(userFranchises.map(f => f.state).filter(Boolean))
  ) as string[];

  // Filter franchises by selected state
  const filteredFranchises =
    selectedState === 'all'
      ? userFranchises
      : userFranchises.filter(franchise => franchise.state === selectedState);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Your Franchises</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {filteredFranchises.length} locations
        </span>
      </div>

      {/* State Filter */}
      {uniqueStates.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Filter by State:</label>
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All States ({userFranchises.length})</option>
            {uniqueStates.map(state => {
              const count = userFranchises.filter(f => f.state === state).length;
              return (
                <option key={state} value={state}>
                  {state} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {filteredFranchises.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredFranchises.map(franchise => {
            const incomeData = franchiseIncomeData?.find(data => data.id === franchise.id);
            const income = incomeData?.income || 0;
            return (
              <LocationInfoCard
                key={franchise.id}
                location={franchise}
                showIncome={true}
                income={income}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Franchises Yet</h4>
          <p className="text-gray-500">Click on the map to start placing your first franchise!</p>
        </div>
      )}
    </div>
  );
}
