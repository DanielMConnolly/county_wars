import React from 'react';
import { Package } from 'lucide-react';
import { PlacedLocation } from '../types/GameTypes';
import { getCountyNameFromCoordinates } from '../utils/reverseGeocode';

interface DistributionCenterInfoCardProps {
  distributionCenter: PlacedLocation;
  index: number;
}

export default function DistributionCenterInfoCard({ distributionCenter, index }: DistributionCenterInfoCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{distributionCenter.name}</h4>
          <p className="text-sm text-gray-600 mt-1">
            Location:{' '}
            {getCountyNameFromCoordinates(distributionCenter.lat, distributionCenter.long)}
          </p>
          {distributionCenter.state && (
            <p className="text-xs text-gray-500 mt-1">State: {distributionCenter.state}</p>
          )}
          {distributionCenter.metroArea && (
            <p className="text-xs text-gray-500 mt-1">
              Metro Area: {distributionCenter.metroArea}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              #{index + 1}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">Active</p>
            <p className="text-xs text-gray-500">status</p>
          </div>
        </div>
      </div>
    </div>
  );
}