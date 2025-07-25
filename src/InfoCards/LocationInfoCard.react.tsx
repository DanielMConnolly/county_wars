import React, { useState, useEffect } from 'react';
import { Building, Truck, X, Settings, DollarSign } from 'lucide-react';
import { PlacedLocation } from '../types/GameTypes';
import { useAuth } from '../auth/AuthContext';
import { DataTestIDs } from '../DataTestIDs';
import InfoRow from '../components/InfoRow';
import { getReadableLocationName } from '../utils/locationUtils';
import { fetchFranchiseById } from '../api_calls/HTTPRequests';

interface LocationInfoCardProps {
  location: PlacedLocation;
  onClose: () => void;
}

const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ location, onClose }) => {
  const { user } = useAuth();
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [income, setIncome] = useState<number | null>(null);
  const [loadingIncome, setLoadingIncome] = useState(false);

  const isOwnedByUser = location.userId === user?.id;
  const isDistributionCenter = location.locationType === 'distribution-center';
  const isFranchise = location.locationType === 'franchise';

  // Fetch income for franchises
  useEffect(() => {
    const fetchIncome = async () => {
      if (isFranchise && location.id) {
        setLoadingIncome(true);
        const response = await fetchFranchiseById(location.id);
        if (response.success && response.franchise) {
          setIncome(response.franchise.income);
        }
        setLoadingIncome(false);
      }
    };

    fetchIncome();
  }, [isFranchise, location.id]);

  // Dynamic content based on location type
  const locationTypeInfo = {
    title: isDistributionCenter ? 'Distribution Center Info' : 'Franchise Info',
    icon: isDistributionCenter ? Truck : Building,
    iconColor: isDistributionCenter ? 'text-orange-400' : 'text-blue-400',
    titleColor: isDistributionCenter ? 'text-orange-400' : 'text-blue-400',
    buttonColor: isDistributionCenter
      ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'
      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    optionsTitle: isDistributionCenter ? 'Distribution Center Options' : 'Franchise Options',
    sellButtonText: isDistributionCenter ? 'Sell Distribution Center' : 'Sell Franchise',
    optionsButtonText: isDistributionCenter ? 'Distribution Center Options' : 'Franchise Options'
  };

  const LocationIcon = locationTypeInfo.icon;

  return (
    <div
      data-testid={DataTestIDs.FRANCHISE_INFO_CARD}
      className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-slate-800 to-slate-900
        backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <LocationIcon className={`w-5 h-5 ${locationTypeInfo.iconColor}`} />
          <h3 className={`text-xl font-bold ${locationTypeInfo.titleColor}`}>
            {locationTypeInfo.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          aria-label="Close location info card"
          data-testid={DataTestIDs.CLOSE_FRANCHISE_INFO_CARD_BUTTON}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <InfoRow
          label="Name:"
          value={location.name}
          className="text-white truncate ml-2"
        />
        <InfoRow
          label="Owner:"
          value={
            <span className={isOwnedByUser ? 'text-green-400' : 'text-blue-300'}>
              {location.username}
            </span>
          }
          className=""
        />
        <InfoRow
          label="Location:"
          value={getReadableLocationName(location)}
          className="text-gray-300 text-sm"
        />
        {isFranchise && (
          <InfoRow
            label="Income:"
            value={
              loadingIncome ? (
                <span className="text-gray-400">Loading...</span>
              ) : income !== null ? (
                <span className="text-green-400 font-semibold">${income.toLocaleString()}</span>
              ) : (
                <span className="text-gray-400">--</span>
              )
            }
            className=""
          />
        )}
      </div>

      {isOwnedByUser && !showOptionsPanel && (
        <button
          onClick={() => setShowOptionsPanel(true)}
          disabled={false}
          className={`w-full mt-6 px-4 py-3 rounded-lg font-bold
            ${locationTypeInfo.buttonColor}
            text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center gap-2`}
          data-testid={DataTestIDs.FRANCHISE_OPTIONS_BUTTON}
        >
          <Settings className="w-4 h-4" />
          {locationTypeInfo.optionsButtonText}
        </button>
      )}

      {isOwnedByUser && showOptionsPanel && (
        <div className="mt-6 space-y-3">
          <div className="text-center mb-4">
            <h4 className={`text-lg font-semibold ${locationTypeInfo.titleColor}`}>
              {locationTypeInfo.optionsTitle}
            </h4>
            <p className="text-gray-400 text-sm">
              Choose an action for your {isDistributionCenter ? 'distribution center' : 'franchise'}
            </p>
          </div>

          <button
            onClick={() => {
              // TODO: Implement sell functionality
              alert('Sell functionality coming soon!');
            }}
            disabled={false}
            className="w-full px-4 py-3 rounded-lg font-bold
              bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600
              text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            {locationTypeInfo.sellButtonText}
          </button>


          <button
            onClick={() => setShowOptionsPanel(false)}
            className="w-full px-4 py-2 rounded-lg font-medium
              bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white
              transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      )}

      {!isOwnedByUser && (
        <div className="mt-6 px-4 py-3 rounded-lg bg-slate-700 text-center">
          <span className="text-gray-300 text-sm">Owned by {location.username}</span>
        </div>
      )}
    </div>
  );
};

export default LocationInfoCard;
