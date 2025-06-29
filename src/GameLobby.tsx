import React, { useState, useEffect } from 'react';
import { Users, Play, Crown } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopMenu from './TopMenu';
import { useAuth } from './auth/AuthContext';
import { LobbyPlayer, User } from './types/GameTypes';
import { startGame, fetchLobbyState } from './api_calls/CountyWarsHTTPRequests';
import { socketService } from './services/socketService';


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
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AuthenticatedGameLobby gameId={gameId} user={user} navigate={navigate} />;
};

const AuthenticatedGameLobby = ({ gameId, user, navigate }: {
  gameId: string | undefined;
  user: User;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);

  // Fetch initial lobby state when component mounts
  useEffect(() => {
    const fetchInitialLobby = async () => {
      if (!gameId || !user.id) return;

      console.log('🏟️ LOBBY: Fetching initial lobby state for game:', gameId, 'user:', user.id);
      const result = await fetchLobbyState(gameId, user.id);

      if (result.success && result.players) {
        console.log('🏟️ LOBBY: Initial lobby state fetched:', result.players);
        setPlayers(result.players);
      } else {
        console.warn('🏟️ LOBBY: Failed to fetch initial lobby state:', result.error);
      }
    };

    fetchInitialLobby();
  }, [gameId, user.id]);

  // Listen for lobby updates via socket events
  useEffect(() => {
    const handleLobbyUpdate = (data: { players: LobbyPlayer[] }) => {
      console.log('🏟️ LOBBY: Received lobby update:', data);

      // Log player changes for debugging
      setPlayers(prevPlayers => {
        const prevCount = prevPlayers.length;
        const newCount = data.players.length;

        if (newCount < prevCount) {
          console.log(`🏃 LOBBY: Player left. Players: ${prevCount} → ${newCount}`);
        } else if (newCount > prevCount) {
          console.log(`👋 LOBBY: Player joined. Players: ${prevCount} → ${newCount}`);
        }

        // Check for host changes
        const prevHost = prevPlayers.find(p => p.isHost);
        const newHost = data.players.find(p => p.isHost);
        if (prevHost?.userId !== newHost?.userId && newHost) {
          console.log(`👑 LOBBY: New host: ${newHost.username} (${newHost.userId})`);
        }

        // Server sends authoritative player list, so we can safely replace it
        // No need to check for duplicates since server already handles that
        return data.players;
      });
    };

    // Add event listener
    socketService.on('lobby-updated', handleLobbyUpdate);
    // Cleanup
    return () => {
      socketService.off('lobby-updated', handleLobbyUpdate);
    };
  }, []);

  const handleStartGame = async () => {
    if (!gameId) return;

    try {
      const result = await startGame(gameId);
      if (result.success) {
        navigate(`/game/${gameId}`);
      } else {
        alert(result.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const maxPlayers = 4;
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden relative">
      <TopMenu />

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
            {(() => {
              const currentPlayer = players.find(player => player.userId === user.id);
              const isHost = currentPlayer?.isHost || false;

              if (isHost) {
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
