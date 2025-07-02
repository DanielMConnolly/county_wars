import React, { useState, useEffect, useContext } from 'react';
import { Trophy } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { useAuth } from '../auth/AuthContext';

interface GamePlayer {
  userId: string;
  username: string;
  highlightColor: string;
  money: number;
  joinedAt: string;
}

interface GameStandingsProps {
  isVisible: boolean;
}

export default function GameStandings({ isVisible }: GameStandingsProps) {
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();

  const fetchGamePlayers = async () => {
    if (!gameState.currentGameId) return;

    setLoadingPlayers(true);
    try {
      const response = await fetch(`/api/games/${gameState.currentGameId}/players`);
      if (response.ok) {
        const players = await response.json();
        setGamePlayers(players);
      } else {
        console.error('Failed to fetch game players');
      }
    } catch (error) {
      console.error('Error fetching game players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchGamePlayers();
    }
  }, [isVisible, gameState.currentGameId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Game Standings</h3>
        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {gamePlayers.length} players
        </span>
      </div>

      {loadingPlayers ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading player standings...</p>
        </div>
      ) : gamePlayers.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {gamePlayers.map((player, index) => (
            <div key={player.userId} className={`border rounded-lg p-4 ${
              user && player.userId === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    {index === 1 && <div className="w-4 h-4 bg-gray-400 rounded-full"></div>}
                    {index === 2 && <div className="w-4 h-4 bg-orange-400 rounded-full"></div>}
                    {index > 2 && <span className="text-sm font-medium text-gray-600">#{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${
                        user && player.userId === user.id ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {player.username}
                        {user && player.userId === user.id && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                      </h4>
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white shadow-sm`}
                        style={{ backgroundColor: player.highlightColor }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    user && player.userId === user.id ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    ${player.money.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Rank #{index + 1}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Players Yet</h4>
          <p className="text-gray-500">Players will appear here once they join the game!</p>
        </div>
      )}
    </div>
  );
}