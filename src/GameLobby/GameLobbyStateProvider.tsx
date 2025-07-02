import React, { useState, useEffect, ReactNode } from 'react';
import { GameLobbyContext, GameLobbyContextType } from './GameLobbyContext';
import { LobbyPlayer } from '../types/GameTypes';
import { fetchLobbyState } from '../api_calls/HTTPRequests';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Toast/ToastContext';
import { connectToLobbySocket, disconnectFromLobbySocket } from '../services/connectToLobbySocket';

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


  // Socket connection setup
  useEffect(() => {
    const userId = user?.id;

    if (!userId || !gameId) return;


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

  }, [user?.id, gameId]); // Removed showToast and navigate from dependencies to prevent re-runs

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
