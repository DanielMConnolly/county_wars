import React, { useState, useEffect, ReactNode } from 'react';
import { GameLobbyContext, GameLobbyContextType } from './GameLobbyContext';
import { LobbyPlayer } from '../types/GameTypes';
import { fetchLobbyState } from '../api_calls/HTTPRequests';
import { socketService } from '../services/socketService';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { connectToSocket } from '../services/connectToSocket';
import { useToast } from '../Toast/ToastContext';

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

        // Add safety check to remove any potential duplicates from initial fetch
        const uniquePlayers = result.players.filter((player: LobbyPlayer, index: number, array: LobbyPlayer[]) =>
          array.findIndex((p: LobbyPlayer) => p.userId === player.userId) === index
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
    disconnectFromLobbySocket();

    const handleGameStarting = (data: { gameId: string; startedBy: string; players: LobbyPlayer[] }) => {
      console.log('🚀 LOBBY: Game starting, navigating to game...');
      navigate(`/game/${gameId}`);
    };

    connectToLobbySocket({
      userId,
      gameId,
      setLobbyPlayers: setPlayers,
      setIsConnected,
      onGameStarting: handleGameStarting,
      showToast
    });

    return () => {
      disconnectFromLobbySocket();
    };
  }, [user?.id, gameId, showToast, navigate]);

  // Socket event handling is now managed in connectToLobbySocket

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
