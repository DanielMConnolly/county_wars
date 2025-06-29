import { socketService } from "./socketService";
import { GameState, Franchise } from "../types/GameTypes";

interface ConnectToSocketParams {
  userId: string;
  gameId: string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

export const connectToSocket = async ({
  userId,
  gameId,
  setGameState,
  setIsConnected,
  showToast
}: ConnectToSocketParams) => {
  try {
    await socketService.connect(userId, gameId);
    setIsConnected(true);

    socketService.on('franchise-added', (franchiseData: Franchise) => {
      console.log('🎯 CLIENT: Received franchise-added event:', franchiseData);
      setGameState((prevState) => {
        console.log('🎯 CLIENT: Updating franchise list. Current count:', prevState.franchises.length);
        const newState = {
          ...prevState,
          franchises: [...prevState.franchises, franchiseData]
        };
        console.log('🎯 CLIENT: New franchise count:', newState.franchises.length);
        return newState;
      });
    });

    socketService.on('time-update', (serverElapsedTime: number) => {

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

    socketService.on('game-paused', (data: { pausedBy: string }) => {
      console.log('⏸️ CLIENT: Game paused by another player:', data.pausedBy);
      setGameState((prevState) => ({
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          isPaused: true
        }
      }));
    });

    socketService.on('game-resumed', () => {
      setGameState((prevState) => ({
        ...prevState,
        gameTime: {
          ...prevState.gameTime,
          isPaused: false
        }
      }));
    });

    socketService.on('money-update', (data: { userId: string; newMoney: number }) => {
      setGameState((prevState) => ({
        ...prevState,
        money: data.newMoney
      }));

      if (showToast) {
        showToast(`💰 Your money has been updated to $${data.newMoney.toLocaleString()}`, 'success', 4000);
      }
    });

    socketService.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });
  } catch (error) {
    console.error('Failed to connect to socket:', error);
    setIsConnected(false);
  }
};

// Cleanup function to remove event listeners
export const disconnectFromSocket = () => {
  socketService.disconnect();
};
