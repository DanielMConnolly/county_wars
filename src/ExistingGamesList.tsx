import React from 'react';
import { Users } from 'lucide-react';
import { DataTestIDs } from './DataTestIDs';

interface Game {
  id: string;
  name: string;
  created_at: string;
  created_by_username?: string;
}

interface ExistingGamesListProps {
  games: Game[];
  isLoadingGames: boolean;
  onJoinGame: (gameId: string) => void;
  onCreateGame: () => void;
}

export default function ExistingGamesList({
  games,
  isLoadingGames,
  onJoinGame,
  onCreateGame,
}: ExistingGamesListProps) {
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
                  {game.name}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  Created by {game.created_by_username || 'Unknown'}
                   • {new Date(game.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
      <button
        onClick={onCreateGame}
        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg
         font-medium transition-colors"
      >
        Create New Game
      </button>
    </div>
  );
}
