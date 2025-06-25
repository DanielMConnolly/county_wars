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
      console.log('Received franchise-added event:', franchiseData);
      setGameState((prevState) => ({
        ...prevState,
        franchises: [...prevState.franchises, franchiseData]
      }));
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
