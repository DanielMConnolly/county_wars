import { welcomeSocketService } from "./welcomeSocketService";
import { Game } from '../types/GameTypes';

interface ConnectToWelcomeSocketParams {
  onGameCreated?: (game: Game) => void;
  onGameDeleted?: (gameId: string) => void;
  onGameStatusChanged?: (data: { gameId: string; status: string }) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

export const connectToWelcomeSocket = async ({
  onGameCreated,
  onGameDeleted,
  onGameStatusChanged,
  showToast
}: ConnectToWelcomeSocketParams) => {
  try {
    await welcomeSocketService.connect();

    if (onGameCreated) {
      welcomeSocketService.on('game-created', (game: Game) => {
        console.log('🎮 WELCOME: New game created:', game.id);
        onGameCreated(game);
        if (showToast) {
          showToast(`🎮 New game "${game.id}" is available to join!`, 'info', 4000);
        }
      });
    }

    if (onGameDeleted) {
      welcomeSocketService.on('game-deleted', (data: { gameId: string }) => {
        console.log('🗑️ WELCOME: Game deleted:', data.gameId);
        onGameDeleted(data.gameId);
        if (showToast) {
          showToast(`Game "${data.gameId}" has been removed`, 'warning', 3000);
        }
      });
    }

    if (onGameStatusChanged) {
      welcomeSocketService.on('game-status-changed', (data: { gameId: string; status: string }) => {
        console.log('🔄 WELCOME: Game status changed:', data);
        onGameStatusChanged(data);
      });
    }

    welcomeSocketService.on('error', (data: { message: string }) => {
      console.error('Welcome socket error:', data.message);
      if (showToast) {
        showToast(`Error: ${data.message}`, 'error', 5000);
      }
    });

  } catch (error) {
    console.error('Failed to connect to welcome socket:', error);
    if (showToast) {
      showToast('Failed to connect to real-time updates', 'error', 5000);
    }
  }
};

// Cleanup function to remove event listeners
export const disconnectFromWelcomeSocket = () => {
  welcomeSocketService.disconnect();
};