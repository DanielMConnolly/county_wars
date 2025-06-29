import React, { useState, useEffect, ReactNode } from 'react';
import { GameLobbyContext, GameLobbyContextType } from './GameLobbyContext';
import { LobbyPlayer } from './types/GameTypes';
import { fetchLobbyState } from './api_calls/HTTPRequests';
import { socketService } from './services/socketService';
import { useAuth } from './auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { connectToSocket } from './services/connectToSocket';
import { useToast } from './Toast/ToastContext';

interface GameLobbyStateProviderProps {
  children: ReactNode;
  gameId: string;
}

export const GameLobbyStateProvider: React.FC<GameLobbyStateProviderProps> = ({
  children,
  gameId,
}) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [_isConnected, setIsConnected] = useState<boolean>(false);
  const { showToast } = useToast();

  // Fetch initial lobby state when component mounts
  useEffect(() => {
    const fetchInitialLobby = async () => {
      if (!gameId || !user?.id) return;

      console.log('🏟️ LOBBY: Fetching initial lobby state for game:', gameId, 'user:', user.id);
      const result = await fetchLobbyState(gameId, user.id);

      if (result.success && result.players) {
        console.log('🏟️ LOBBY: Initial lobby state fetched:', result.players);

        // Add safety check to remove any potential duplicates from initial fetch
        const uniquePlayers = result.players.filter((player, index, array) =>
          array.findIndex(p => p.userId === player.userId) === index
        );

        if (uniquePlayers.length !== result.players.length) {
          console.warn('🚨 LOBBY: Removed duplicate players from initial fetch', {
            original: result.players.length,
            filtered: uniquePlayers.length
          });
        }

        setPlayers(uniquePlayers);
      } else {
        console.warn('🏟️ LOBBY: Failed to fetch initial lobby state:', result.error);
      }
    };

    fetchInitialLobby();
  }, [gameId, user?.id]);

  // Socket connection setup
  useEffect(() => {
    const userId = user?.id;

    if (!userId || !gameId) return;

    // Disconnect any existing connection
    socketService.disconnect();

    // We need a dummy setGameState function since connectToSocket expects it
    // but we don't use it in the lobby context
    const dummySetGameState = () => {};

    connectToSocket({
      userId,
      gameId,
      setGameState: dummySetGameState,
      setIsConnected,
      showToast
    });

    return () => {
      socketService.disconnect();
    };
  }, [user?.id, gameId, showToast]);

  // Listen for lobby updates via socket events
  useEffect(() => {
    const handleLobbyUpdate = (data: { players: LobbyPlayer[] }) => {

      // Log player changes for debugging
      setPlayers(prevPlayers => {
        // Check for host changes
        const prevHost = prevPlayers.find(p => p.isHost);
        const newHost = data.players.find(p => p.isHost);
        if (prevHost?.userId !== newHost?.userId && newHost) {
          console.log(`👑 LOBBY: New host: ${newHost.username} (${newHost.userId})`);
        }

        // Server sends authoritative player list, so we can safely replace it
        // Add extra safety check to remove any potential duplicates
        const uniquePlayers = data.players.filter((player, index, array) =>
          array.findIndex(p => p.userId === player.userId) === index
        );

        if (uniquePlayers.length !== data.players.length) {
          console.warn('🚨 LOBBY: Removed duplicate players from server data', {
            original: data.players.length,
            filtered: uniquePlayers.length
          });
        }

        return uniquePlayers;
      });
    };

    // Add event listener
    socketService.on('lobby-updated', handleLobbyUpdate);

    // Cleanup
    return () => {
      socketService.off('lobby-updated', handleLobbyUpdate);
    };
  }, []);

  // Listen for game-started events
  useEffect(() => {
    const handleGameStarted = (data: { gameId: string }) => {
      navigate(`/game/${data.gameId}`);
    };

    // Add event listener
    socketService.on('game-started', handleGameStarted);

    // Cleanup
    return () => {
      socketService.off('game-started', handleGameStarted);
    };
  }, [navigate]);

  // Helper function to check if a user is the host
  const isHost = (userId: string): boolean => {
    const player = players.find(p => p.userId === userId);
    return player?.isHost || false;
  };

  // Helper function to get the current user's player data
  const getCurrentUser = (): LobbyPlayer | undefined => {
    if (!user?.id) return undefined;
    return players.find(p => p.userId === user.id);
  };

  const contextValue: GameLobbyContextType = {
    players,
    setPlayers,
    gameId,
    isHost,
    getCurrentUser,
  };

  return (
    <GameLobbyContext.Provider value={contextValue}>
      {children}
    </GameLobbyContext.Provider>
  );
};
