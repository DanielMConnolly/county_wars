import React from 'react';
import { Package, UtensilsCrossed } from 'lucide-react';
import { PlacedLocation, Franchise } from '../types/GameTypes';
import { getReadableLocationName } from '../utils/locationUtils';

interface LocationListCardProps {
  location: PlacedLocation | Franchise;
  showIncome?: boolean;
  income?: number;
}

export default function LocationListCard({
  location,
  showIncome = false,
  income = 0,
}: LocationListCardProps) {
  const isDistributionCenter = location.locationType === 'distribution-center';
  const franchise = location as Franchise;

  // Choose icon and color based on location type
  const IconComponent = isDistributionCenter ? Package : UtensilsCrossed;
  const iconColor = isDistributionCenter ? 'text-blue-500' : 'text-orange-500';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{location.name}</h4>
          <p className="text-sm text-gray-600 mt-1">
            Location: {getReadableLocationName(location)}
          </p>
          {location.state && <p className="text-xs text-gray-500 mt-1">State: {location.state}</p>}
          {location.metroArea && (
            <p className="text-xs text-gray-500 mt-1">Metro Area: {location.metroArea}</p>
          )}
          {!isDistributionCenter && franchise.population && (
            <p className="text-xs text-gray-500 mt-1">
              Population: {franchise.population.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="text-right">
            {showIncome ? (
              <>
                <p className="text-sm font-semibold text-green-600">${income}</p>
                <p className="text-xs text-gray-500">income</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-blue-600">Active</p>
                <p className="text-xs text-gray-500">status</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
