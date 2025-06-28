import React, { useState } from 'react';
import { Users, Play, Crown } from 'lucide-react';
import TopMenu from './TopMenu';
import { useAuth } from './auth/AuthContext';
import { User } from './types/GameTypes';

interface LobbyPlayer extends User {
  isHost: boolean;
}

const GameLobby = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<LobbyPlayer[]>([
    { 
      id: user?.id || '1', 
      username: user?.username || 'You',
      email: user?.email || '',
      isHost: true 
    }
  ]);

  const handleStartGame = () => {
    console.log('Starting game with players:', players);
  };

  const maxPlayers = 4;
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden relative">
      <TopMenu />
      
      <div className="pt-16 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
            <p className="text-gray-300">Waiting for players to join...</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Players ({players.length}/{maxPlayers})
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{player.username}</span>
                  </div>
                  {player.isHost && (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              ))}

              {Array.from({ length: emptySlots }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-white/5 border border-white/10 border-dashed rounded-lg p-4 flex items-center justify-center text-gray-400"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm">Waiting for player...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={players.length < 1}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>
            <p className="text-gray-400 text-sm mt-2">
              {players.length < 2 && "You can start with just yourself for testing"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;