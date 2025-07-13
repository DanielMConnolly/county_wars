import React, { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { useAuth } from '../auth/AuthContext';
import { getCurrentGameId } from '../utils/gameUrl';
import { getStateStats } from '../api_calls/HTTPRequests';
import InfoRow from '../components/InfoRow';

interface StateStats {
  totalFranchises: number;
  userFranchises: number;
}

interface StateInfoCardProps {
  stateName: string;
  onClose: () => void;
}

const StateInfoCard: React.FC<StateInfoCardProps> = ({ stateName, onClose }) => {
  const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();
  const [stateStats, setStateStats] = useState<StateStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStateStats = async () => {
      const gameId = getCurrentGameId();
      if (!stateName || !user?.id || !gameId) return;
      
      setLoading(true);
      try {
        const result = await getStateStats(gameId, stateName, user.id);
        
        if (result.success) {
          setStateStats({
            totalFranchises: result.totalFranchises || 0,
            userFranchises: result.userFranchises || 0,
          });
        } else {
          console.error('Error fetching state stats:', result.error);
          // Fallback to local calculation
          const allFranchises = gameState.locations.filter(
            location => location.locationType === 'franchise'
          );
          
          const stateFranchises = allFranchises.filter(
            franchise => franchise.state === stateName
          );
          
          const userFranchisesInState = stateFranchises.filter(
            franchise => franchise.userId === user.id
          );

          setStateStats({
            totalFranchises: stateFranchises.length,
            userFranchises: userFranchisesInState.length,
          });
        }
      } catch (error) {
        console.error('Error fetching state stats:', error);
        setStateStats({ totalFranchises: 0, userFranchises: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStateStats();
  }, [stateName, user?.id, gameState.locations]);

  if (!stateName) return null;

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">{stateName}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <InfoRow 
          label="State:" 
          value={stateName} 
          className="text-white ml-2" 
        />
        
        {loading ? (
          <InfoRow 
            label="Loading..." 
            value="--" 
            className="text-gray-400" 
          />
        ) : (
          <>
            <InfoRow 
              label="Total Franchises:" 
              value={stateStats?.totalFranchises?.toLocaleString() || '0'} 
              className="text-blue-300" 
            />
            
            <InfoRow 
              label="My Franchises:" 
              value={
                <span className={stateStats?.userFranchises ? 'text-green-400' : 'text-gray-300'}>
                  {stateStats?.userFranchises?.toLocaleString() || '0'}
                </span>
              } 
              className="" 
            />
          </>
        )}
      </div>
    </>
  );
};

export default StateInfoCard;