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


    gameSocketService.on('turn-update', (data: { turnNumber: number; playerWhosTurnItIs: string }) => {
      console.log('🔄 GAME: Turn update received:', data);
      setGameState((prevState) => ({
        ...prevState,
        turnNumber: data.turnNumber,
        playerWhosTurnItIs: data.playerWhosTurnItIs
      }));
      
      if (showToast) {
        showToast(`Turn ${data.turnNumber} has started`, 'info', 3000);
      }
    });

    gameSocketService.on('turn-error', (data: { message: string }) => {
      console.error('Turn error:', data.message);
      if (showToast) {
        showToast(`Turn error: ${data.message}`, 'error', 5000);
      }
    });

    gameSocketService.on('game-state-sync', (data: { turnNumber: number; playerWhosTurnItIs: string }) => {
      console.log('🔄 GAME: Game state sync received:', data);
      setGameState((prevState) => ({
        ...prevState,
        turnNumber: data.turnNumber,
        playerWhosTurnItIs: data.playerWhosTurnItIs
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
