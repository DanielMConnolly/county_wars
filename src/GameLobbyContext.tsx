import React, { createContext, useContext } from 'react';
import { LobbyPlayer } from './types/GameTypes';

export interface GameLobbyContextType {
  players: LobbyPlayer[];
  setPlayers: React.Dispatch<React.SetStateAction<LobbyPlayer[]>>;
  gameId: string | null;
  isHost: (userId: string) => boolean;
  getCurrentUser: () => LobbyPlayer | undefined;
}

export const GameLobbyContext = createContext<GameLobbyContextType | undefined>(undefined);

export const useGameLobby = (): GameLobbyContextType => {
  const context = useContext(GameLobbyContext);
  if (context === undefined) {
    throw new Error('useGameLobby must be used within a GameLobbyStateProvider');
  }
  return context;
};