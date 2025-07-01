import React, { useContext, useState } from 'react';
import { Building, X, Trash2, Settings, DollarSign, AlertTriangle } from 'lucide-react';
import { GameStateContext } from './GameStateContext';
import { Franchise } from './types/GameTypes';
import { useAuth } from './auth/AuthContext';
import { removeFranchise } from './api_calls/HTTPRequests';
import { DataTestIDs } from './DataTestIDs';
import { elapsedTimeToGameDate } from './utils/elapsedTimeToGameDate';
import { getCountyNameFromCoordinates } from './utils/reverseGeocode';
import InfoRow from './components/InfoRow';

interface FranchiseInfoCardProps {
  franchise: Franchise;
  onClose: () => void;
}

const FranchiseInfoCard: React.FC<FranchiseInfoCardProps> = ({ franchise, onClose }) => {
  const { gameState, setGameState } = useContext(GameStateContext);
  const { user } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);

  const isOwnedByUser = franchise.userId === user?.id;

  const handleRemoveFranchise = async () => {
    if (!user?.id || !isOwnedByUser || isRemoving) return;

    setIsRemoving(true);
    try {
      const result = await removeFranchise(franchise.id, user.id);
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
      className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-slate-800 to-slate-900
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
          value={franchise.metroArea && franchise.state ? `${franchise.metroArea}, ${franchise.state}` : 
                 franchise.county && franchise.state ? `${franchise.county}, ${franchise.state}` :
                 franchise.county ? franchise.county :
                 franchise.metroArea ? franchise.metroArea :
                 getCountyNameFromCoordinates(franchise.lat, franchise.long)}
          className="text-gray-300 text-sm"
        />
      </div>

      {isOwnedByUser && !showOptionsPanel && (
        <button
          onClick={() => setShowOptionsPanel(true)}
          disabled={gameState.gameTime?.isPaused}
          className="w-full mt-6 px-4 py-3 rounded-lg font-bold
            bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600
            text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center gap-2"
          data-testid={DataTestIDs.FRANCHISE_OPTIONS_BUTTON}
        >
          <Settings className="w-4 h-4" />
          Franchise Options
        </button>
      )}

      {isOwnedByUser && showOptionsPanel && (
        <div className="mt-6 space-y-3">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-blue-400">Franchise Options</h4>
            <p className="text-gray-400 text-sm">Choose an action for your franchise</p>
          </div>
          
          <button
            onClick={() => {
              // TODO: Implement sell franchise functionality
              alert('Sell functionality coming soon!');
            }}
            disabled={gameState.gameTime?.isPaused}
            className="w-full px-4 py-3 rounded-lg font-bold
              bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600
              text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Sell Franchise
          </button>
          
          <button
            onClick={handleRemoveFranchise}
            disabled={isRemoving || gameState.gameTime?.isPaused}
            className="w-full px-4 py-3 rounded-lg font-bold
              bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600
              text-white transition-all duration-300 hover:scale-105 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center justify-center gap-2"
            data-testid={DataTestIDs.REMOVE_FRANCHISE_BUTTON}
          >
            {isRemoving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Abandoning...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Abandon Franchise
              </>
            )}
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
          <span className="text-gray-300 text-sm">Owned by {franchise.username}</span>
        </div>
      )}
    </div>
  );
};


export default FranchiseInfoCard;