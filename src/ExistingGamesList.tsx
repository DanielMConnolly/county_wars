import React from 'react';
import { Users, Play } from 'lucide-react';
import { DataTestIDs } from './DataTestIDs';
import {Game} from '@prisma/client';


interface ExistingGamesListProps {
  games: Game[];
  isLoadingGames: boolean;
  onJoinGame: (gameId: string) => void;
}

export default function ExistingGamesList({
  games,
  isLoadingGames,
  onJoinGame,
}: ExistingGamesListProps) {
  if (isLoadingGames) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading your games...</p>
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
                <h4 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">
                  {game.id}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  Status: <span className="text-green-400 font-medium">{game.status}</span>
                   • Created {new Date(game.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Continue
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
      <p className="text-xl text-gray-300 mb-2">No active games</p>
      <p className="text-gray-500">Join a game lobby to start playing!</p>
    </div>
  );
}