import React, { useState, useEffect, ReactNode } from 'react';
import { GameLobbyContext, GameLobbyContextType } from './GameLobbyContext';
import { LobbyPlayer } from './types/GameTypes';
import { fetchLobbyState } from './api_calls/CountyWarsHTTPRequests';
import { socketService } from './services/socketService';
import { useAuth } from './auth/AuthContext';

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

  // Fetch initial lobby state when component mounts
  useEffect(() => {
    const fetchInitialLobby = async () => {
      if (!gameId || !user?.id) return;

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
  }, [gameId, user?.id]);

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