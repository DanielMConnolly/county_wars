import { socketService } from "./socketService";
import { GameState } from "../types/GameTypes";

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

    // Set up socket event listeners for real-time updates only
    socketService.on('county-claimed', (data: { countyName: string }) => {
      try {
        console.log('Received county-claimed event:', data);
        setGameState(prevState => ({
          ...prevState,
          ownedCounties: new Set([...prevState.ownedCounties, data.countyName])
        }));
        console.log('Successfully updated state for county-claimed');
      } catch (error) {
        console.error('Error handling county-claimed event:', error);
      }
    });

    socketService.on('county-released', (data: { countyName: string }) => {
      try {
        console.log('Received county-released event:', data);
        setGameState(prevState => {
          const newOwnedCounties = new Set(prevState.ownedCounties);
          newOwnedCounties.delete(data.countyName);
          return {
            ...prevState,
            ownedCounties: newOwnedCounties
          };
        });
        console.log('Successfully updated state for county-released');
      } catch (error) {
        console.error('Error handling county-released event:', error);
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
