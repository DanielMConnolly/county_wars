import { gameSocketService } from "./gameSocketService";
import { GameState, Franchise } from "../types/GameTypes";

interface ConnectToGameSocketParams {
  userId: string;
  gameId: string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

export const connectToGameSocket = async ({
  userId,
  gameId,
  setGameState,
  setIsConnected,
  showToast
}: ConnectToGameSocketParams) => {
  try {
    await gameSocketService.connect(userId, gameId);
    setIsConnected(true);

    gameSocketService.on('location-added', (locationData: Franchise) => {
      console.log('🎯 GAME: Received location-added event:', locationData);
      setGameState((prevState) => {
        const newState = {
          ...prevState,
          locations: [...prevState.locations, locationData]
        };
        console.log('🎯 GAME: New location count:', newState.locations.length);
        return newState;
      });
    });

    gameSocketService.on('franchise-removed', (franchiseData: { id: string; userId: string }) => {
      console.log('🗑️ GAME: Received franchise-removed event:', franchiseData);
      setGameState((prevState) => ({
        ...prevState,
        locations: prevState.locations.filter(f => f.id !== franchiseData.id)
      }));
    });

    gameSocketService.on('time-update', (serverElapsedTime: number) => {
      // Check if client time is out of sync with server time
      setGameState((prevState) => {
        const clientElapsedTime = prevState.gameTime.elapsedTime || 0;
        const timeDrift = Math.abs(clientElapsedTime - serverElapsedTime);

        if (timeDrift > 1000) {
          return {
            ...prevState,
            gameTime: {
              ...prevState.gameTime,
              elapsedTime: serverElapsedTime
            }
          };
        } else {
          return prevState;
        }
      });
    });

    gameSocketService.on('game-paused', (data: { pausedBy: string }) => {
      console.log('⏸️ GAME: Game paused by another player:', data.pausedBy);
      setGameState((prevState) => ({
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          isPaused: true
        }
      }));
      if (showToast) {
        showToast('⏸️ Game paused by another player', 'warning', 3000);
      }
    });

    gameSocketService.on('game-resumed', (data: { resumedBy: string }) => {
      console.log('▶️ GAME: Game resumed by another player:', data.resumedBy);
      setGameState((prevState) => ({
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          isPaused: false
        }
      }));
      if (showToast) {
        showToast('▶️ Game resumed by another player', 'success', 3000);
      }
    });

    gameSocketService.on('money-update', (data: { userId: string; newMoney: number }) => {
      setGameState((prevState) => ({
        ...prevState,
        money: data.newMoney
      }));

      if (showToast) {
        showToast(`💰 Your money has been updated to $${data.newMoney.toLocaleString()}`, 'success', 4000);
      }
    });

    gameSocketService.on('game-chat-message', (data: { userId: string; message: string; timestamp: number }) => {
      console.log('💬 GAME: Chat message:', data);
      // Handle game chat messages (could emit to a chat state or context)
    });

    gameSocketService.on('game-state-sync', (data: { elapsedTime: number; isGamePaused: boolean }) => {
      console.log('🔄 GAME: Syncing game state:', data);
      setGameState((prevState) => ({
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          elapsedTime: data.elapsedTime,
          isPaused: data.isGamePaused
        }
      }));
    });

    gameSocketService.on('player-left', (data: { userId: string }) => {
      console.log('👋 GAME: Player left:', data.userId);
      if (showToast) {
        showToast(`Player ${data.userId} left the game`, 'info', 3000);
      }
    });

    gameSocketService.on('error', (data: { message: string }) => {
      console.error('Game socket error:', data.message);
      if (showToast) {
        showToast(`Error: ${data.message}`, 'error', 5000);
      }
    });

  } catch (error) {
    console.error('Failed to connect to game socket:', error);
    setIsConnected(false);
    if (showToast) {
      showToast('Failed to connect to game', 'error', 5000);
    }
  }
};

// Cleanup function to remove event listeners
export const disconnectFromGameSocket = () => {
  gameSocketService.disconnect();
};
