import { socketService } from "./socketService";
import { GameState, Franchise } from "../types/GameTypes";

interface ConnectToSocketParams {
  userId: string;
  gameId: string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

export const connectToSocket = async ({
  userId,
  gameId,
  setGameState,
  setIsConnected
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

    socketService.on('time-update', (elapsedTime: number) => {
      console.log('⏰ CLIENT: Received time-update event - Elapsed time:', elapsedTime + 'ms', 'Seconds:', elapsedTime / 1000);
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
