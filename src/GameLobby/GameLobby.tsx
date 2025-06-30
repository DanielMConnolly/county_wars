import React, { useEffect } from 'react';
import { Users, Play, Crown } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import UserMenu from './auth/UserMenu';
import { useAuth } from './auth/AuthContext';
import { User } from './types/GameTypes';
import { lobbySocketService } from './services/lobbySocketService';
import { startGame } from './api_calls/HTTPRequests';
import { GameLobbyStateProvider } from './GameLobbyStateProvider';
import { useGameLobby } from './GameLobbyContext';


const GameLobby = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading } = useAuth();
  console.log('GameLobby: user', user, 'loading', loading);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated (but not while still loading)
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔐 AUTH: Not loading and no user, redirecting to login');
      // Pass current location as redirect parameter
      const redirectTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirectTo}`);
    }
  }, [user, loading, navigate, location]);

  // Show loading or don't render anything if user is not authenticated
  if (loading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent
           rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <GameLobbyStateProvider gameId={gameId!}>
      <AuthenticatedGameLobby gameId={gameId} user={user} navigate={navigate} />
    </GameLobbyStateProvider>
  );
};

const AuthenticatedGameLobby = ({ gameId, user, navigate }: {
  gameId: string | undefined;
  user: User;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const { players, isHost } = useGameLobby();
  const localNavigate = useNavigate();

  const handleStartGame = () => {
    if (!gameId) return;

    try {
      // Use lobby socket service to start the game
      lobbySocketService.startGame();
      console.log('Start game request sent via socket');
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const maxPlayers = 4;
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Top Menu Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800
        to-slate-700 flex items-center justify-between px-6 z-[1000] shadow-lg
        border-b border-slate-600">
        <button
          onClick={() => localNavigate('/')}
          className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          Franchise Wars
        </button>
        <UserMenu />
      </div>

      <div className="pt-16 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border
         border-white/20 p-8 w-full max-w-2xl">
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
                  key={player.userId}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600
                     rounded-full flex items-center justify-center text-white font-bold">
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
                  className="bg-white/5 border border-white/10 border-dashed rounded-lg p-4
                   flex items-center justify-center text-gray-400"
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
            {(() => {
              const currentUserIsHost = isHost(user.id);

              if (currentUserIsHost) {
                return (
                  <>
                    <button
                      onClick={handleStartGame}
                      disabled={players.length < 1}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700
                       hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                      <Play className="w-5 h-5" />
                      Start Game
                    </button>
                    <p className="text-gray-400 text-sm mt-2">
                      {players.length < 2 && "You can start with just yourself for testing"}
                      {players.length >= 2 && `Ready to start with ${players.length} players`}
                    </p>
                  </>
                );
              } else {
                return (
                  <div className="py-3">
                    <p className="text-gray-300 text-lg">
                      Waiting for host to start game...
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      The host will start the game when ready
                    </p>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
