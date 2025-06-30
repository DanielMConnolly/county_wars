import { lobbySocketService } from "./lobbySocketService";
import { LobbyPlayer } from "../types/GameTypes";

interface ConnectToLobbySocketParams {
  userId: string;
  gameId: string;
  setLobbyPlayers: React.Dispatch<React.SetStateAction<LobbyPlayer[]>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  onGameStarting?: (data: { gameId: string; startedBy: string; players: LobbyPlayer[] }) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

export const connectToLobbySocket = async ({
  userId,
  gameId,
  setLobbyPlayers,
  setIsConnected,
  onGameStarting,
  showToast
}: ConnectToLobbySocketParams) => {
  try {
    await lobbySocketService.connect(userId, gameId);
    setIsConnected(true);

    lobbySocketService.on('lobby-updated', (data: { players: LobbyPlayer[] }) => {
      console.log('🏠 LOBBY: Received lobby-updated event:', data);
      setLobbyPlayers(data.players);
    });

    lobbySocketService.on('game-starting', (data: { gameId: string; startedBy: string; players: LobbyPlayer[] }) => {
      console.log('🚀 LOBBY: Game is starting:', data);
      if (onGameStarting) {
        onGameStarting(data);
      }
      if (showToast) {
        showToast('🚀 Game is starting!', 'success', 3000);
      }
    });

    lobbySocketService.on('lobby-chat-message', (data: { userId: string; username: string; message: string; timestamp: number }) => {
      console.log('💬 LOBBY: Chat message:', data);
      // Handle chat message display (could emit to a chat state or context)
    });

    lobbySocketService.on('error', (data: { message: string }) => {
      console.error('Lobby socket error:', data.message);
      if (showToast) {
        showToast(`Error: ${data.message}`, 'error', 5000);
      }
    });

  } catch (error) {
    console.error('Failed to connect to lobby socket:', error);
    setIsConnected(false);
    if (showToast) {
      showToast('Failed to connect to lobby', 'error', 5000);
    }
  }
};

// Cleanup function to remove event listeners
export const disconnectFromLobbySocket = () => {
  lobbySocketService.disconnect();
};