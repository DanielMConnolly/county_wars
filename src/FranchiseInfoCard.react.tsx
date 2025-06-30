import React, { useContext, useState } from 'react';
import { Building, X, Trash2 } from 'lucide-react';
import { GameStateContext } from './GameStateContext';
import { Franchise } from './types/GameTypes';
import { useAuth } from './auth/AuthContext';
import { removeFranchise } from './api_calls/HTTPRequests';
import { DataTestIDs } from './DataTestIDs';
import { elapsedTimeToGameDate } from './utils/elapsedTimeToGameDate';
import { getCountyNameFromCoordinates } from './utils/reverseGeocode';

interface FranchiseInfoCardProps {
  franchise: Franchise;
  onClose: () => void;
}

const FranchiseInfoCard: React.FC<FranchiseInfoCardProps> = ({ franchise, onClose }) => {
  const { gameState, setGameState } = useContext(GameStateContext);
  const { user } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);

  const isOwnedByUser = franchise.userId === user?.id;

  const handleRemoveFranchise = async () => {
    if (!user?.id || !isOwnedByUser || isRemoving) return;

    setIsRemoving(true);
    try {
      const result = await removeFranchise(parseInt(franchise.id, 10), user.id);
      if (result.success) {
        // Remove franchise from local state
        setGameState(prevState => ({
          ...prevState,
          franchises: prevState.franchises.filter(f => f.id !== franchise.id)
        }));
        onClose();
      } else {
        alert(result.error || 'Failed to remove franchise');
      }
    } catch (error) {
      console.error('Error removing franchise:', error);
      alert('Failed to remove franchise. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      data-testid={DataTestIDs.FRANCHISE_INFO_CARD}
      className="fixed bottom-6 right-6 w-80 bg-gradient-to-br from-slate-800 to-slate-900
        backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-blue-400">Franchise Info</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          aria-label="Close franchise info card"
          data-testid={DataTestIDs.CLOSE_FRANCHISE_INFO_CARD_BUTTON}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-3">
        <InfoRow
          label="Name:"
          value={franchise.name}
          className="text-white truncate ml-2"
        />
        <InfoRow
          label="Owner:"
          value={
            <span className={isOwnedByUser ? 'text-green-400' : 'text-blue-300'}>
              {franchise.username}
            </span>
          }
          className=""
        />
        <InfoRow
          label="Placed:"
          value={elapsedTimeToGameDate(franchise.placedAt, gameState.gameTime.gameDurationHours)}
          className="text-gray-300"
        />
        <InfoRow
          label="Location:"
          value={getCountyNameFromCoordinates(franchise.lat, franchise.long)}
          className="text-gray-300 text-sm"
        />
      </div>

      {isOwnedByUser && (
        <button
          onClick={handleRemoveFranchise}
          disabled={isRemoving || gameState.gameTime?.isPaused}
          className="w-full mt-6 px-4 py-3 rounded-lg font-bold
            bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600
            text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center gap-2"
          data-testid={DataTestIDs.REMOVE_FRANCHISE_BUTTON}
        >
          {isRemoving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Remove Franchise
            </>
          )}
        </button>
      )}

      {!isOwnedByUser && (
        <div className="mt-6 px-4 py-3 rounded-lg bg-slate-700 text-center">
          <span className="text-gray-300 text-sm">Owned by {franchise.username}</span>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ 
  label, 
  value, 
  className 
}: { 
  label: string; 
  value: string | React.ReactNode; 
  className: string;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    {typeof value === 'string' ? (
      <span className={`font-semibold ${className}`}>{value}</span>
    ) : (
      <div className={`font-semibold ${className}`}>{value}</div>
    )}
  </div>
);

export default FranchiseInfoCard;