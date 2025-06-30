import React from 'react';
import { Users, Trash2 } from 'lucide-react';
import { DataTestIDs } from './DataTestIDs';
import { deleteGame } from './api_calls/HTTPRequests';
import {Game} from '@prisma/client';


interface GamesToJoinProps {
  games: Game[];
  isLoadingGames: boolean;
  onJoinGame: (gameId: string) => void;
  onGameDeleted: () => void; // Callback to refresh the games list
}

export default function GamesToJoin({
  games,
  isLoadingGames,
  onJoinGame,
  onGameDeleted,
}: GamesToJoinProps) {
  const handleDeleteGame = async (gameId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the join game click

    if (window.confirm(`Are you sure you want to delete this game? This action cannot be undone.`)) {
      try {
        const result = await deleteGame(gameId);
        if (result.success) {
          onGameDeleted(); // Refresh the games list
        } else {
          alert(`Failed to delete game: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('Failed to delete game. Please try again.');
      }
    }
  };
  if (isLoadingGames) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading games...</p>
      </div>
    );
  }

  if (games.length > 0) {
    return (
      <div className="grid gap-4 max-h-96 overflow-y-auto" data-testid={DataTestIDs.EXISTING_GAMES_LIST}>
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10
            transition-all duration-300 cursor-pointer group"
            onClick={() => onJoinGame(game.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  {game.id}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  Created by {game.createdBy|| 'Unknown'}
                   • {new Date(game.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDeleteGame(game.id, e)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-medium transition-colors"
                  title="Delete Game"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                  Join
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p className="text-xl text-gray-300 mb-2">No games available</p>
      <p className="text-gray-500">Be the first to create a game!</p>
    </div>
  );
}