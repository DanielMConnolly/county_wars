import { Server } from 'socket.io';
import { dbOperations } from './database.js';
import type { ServerGameState } from '../src/types/GameTypes.js';

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
    gameId: string;
  }
}

// Store game state for each game (gameId -> ServerGameState) - exported for server access
export const gameStates = new Map<string, ServerGameState>();

export function setupSocketForGame(io: Server, namespace = '/game') {
  const gameNamespace = io.of(namespace);

  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

  // Authentication middleware for socket connections
  gameNamespace.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const gameId = socket.handshake.auth.gameId || 'default-game';
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    socket.gameId = gameId;
    next();
  });

  gameNamespace.on('connection', async (socket) => {

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, { userId: socket.userId, gameId: socket.gameId });
    dbOperations.createUser(socket.userId);

    // Join the game-specific room
    socket.join(`game-${socket.gameId}`);

    // Initialize game state if it doesn't exist, reading turn info from database
    if (!gameStates.has(socket.gameId)) {
      try {
        const turnInfo = await dbOperations.getGameTurnInfo(socket.gameId);

        gameStates.set(socket.gameId, {
          turnNumber: turnInfo.turnNumber,
          playerWhosTurnItIs: turnInfo.playerWhosTurnItIs,
          lobbyPlayers: []
        });
      } catch (error) {
        console.error(`Error reading turn info from DB for game ${socket.gameId}:`, error);
        // Fallback to default state
        gameStates.set(socket.gameId, {
          turnNumber: 1,
          playerWhosTurnItIs: null,
          lobbyPlayers: []
        });
      }
    }

    // Handle franchise removal events
    socket.on('franchise-removed', (franchiseData) => {
      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-removed', franchiseData);
    });

    // Handle turn advancement
    socket.on('advance-turn', async () => {
      const gameState = gameStates.get(socket.gameId);
      if (!gameState) return;

      // Only allow current player to advance their turn
      if (gameState.playerWhosTurnItIs !== socket.userId) {
        socket.emit('turn-error', { message: 'Not your turn' });
        return;
      }

      try {
        // Get all players in the game to determine next player
        const players = await dbOperations.getGamePlayersWithMoney(socket.gameId);
        if (players.length === 0) {
          socket.emit('turn-error', { message: 'No players in game' });
          return;
        }

        // Find current player index and calculate next player
        const currentPlayerIndex = players.findIndex(p => p.userId === gameState.playerWhosTurnItIs);
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayerId = players[nextPlayerIndex].userId;

        // Update database
        const success = await dbOperations.advanceGameTurn(socket.gameId, nextPlayerId);
        if (success) {
          // Update local state
          gameState.turnNumber += 1;
          gameState.playerWhosTurnItIs = nextPlayerId;
          gameStates.set(socket.gameId, gameState);

          // Broadcast turn update to all players
          gameNamespace.to(`game-${socket.gameId}`).emit('turn-update', {
            turnNumber: gameState.turnNumber,
            playerWhosTurnItIs: gameState.playerWhosTurnItIs
          });
        } else {
          socket.emit('turn-error', { message: 'Failed to advance turn' });
        }
      } catch (error) {
        console.error(`Error advancing turn for game ${socket.gameId}:`, error);
        socket.emit('turn-error', { message: 'Database error' });
      }
    });


    // Handle player chat in game
    socket.on('game-chat', (data) => {
      // Broadcast chat message to all players in game
      gameNamespace.to(`game-${socket.gameId}`).emit('game-chat-message', {
        userId: socket.userId,
        message: data.message,
        timestamp: Date.now()
      });
    });

    // Handle game state sync requests
    socket.on('request-game-sync', async () => {
      let gameState = gameStates.get(socket.gameId);
      if (!gameState) {
        try {
          const turnInfo = await dbOperations.getGameTurnInfo(socket.gameId);
          gameState = { 
            turnNumber: turnInfo.turnNumber,
            playerWhosTurnItIs: turnInfo.playerWhosTurnItIs,
            lobbyPlayers: [] 
          };
          gameStates.set(socket.gameId, gameState);
        } catch (error) {
          console.error(`Error reading turn info from DB for sync request in game ${socket.gameId}:`, error);
          gameState = { 
            turnNumber: 1,
            playerWhosTurnItIs: null,
            lobbyPlayers: [] 
          };
          gameStates.set(socket.gameId, gameState);
        }
      }

      socket.emit('game-state-sync', {
        turnNumber: gameState.turnNumber,
        playerWhosTurnItIs: gameState.playerWhosTurnItIs
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      userSessions.delete(socket.id);

      // Notify other players that this user left the game
      socket.to(`game-${socket.gameId}`).emit('player-left', {
        userId: socket.userId
      });
    });
  });

  return gameNamespace;
}