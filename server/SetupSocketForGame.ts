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

  // Set up interval timer to emit elapsed time and update money every 10 seconds
  setInterval(async () => {
    // Get all active game rooms
    const rooms = gameNamespace.adapter.rooms;

    for (const [roomName, sockets] of rooms) {
      // Only process game rooms (that start with 'game-')
      if (roomName.startsWith('game-') && sockets.size > 0) {
        const gameId = roomName.replace('game-', '');

        // Get current game state, or initialize with elapsed time from database
        let gameState = gameStates.get(gameId);
        if (!gameState) {
          try {
            const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(gameId);
            gameState = { elapsedTime: elapsedTimeFromDB, isGamePaused: false, lobbyPlayers: [] };
            gameStates.set(gameId, gameState);
            console.log(`Initialized game state for ${gameId} from DB with elapsed time: ${elapsedTimeFromDB}ms`);
          } catch (error) {
            console.error(`Error reading elapsed time from DB for game ${gameId}:`, error);
            gameState = { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
            gameStates.set(gameId, gameState);
          }
        }

        // Only increment time if game is not paused
        if (!gameState.isGamePaused) {
          gameState.elapsedTime += 10000; // Increment by 10 seconds (10000ms)

          // Update elapsed time in database
          try {
            const dbUpdateSuccess = await dbOperations.updateGameElapsedTime(gameId, gameState.elapsedTime);
            if (dbUpdateSuccess) {
              console.log(`Updated elapsed time in DB for game ${gameId}: ${gameState.elapsedTime}ms`);
            } else {
              console.error(`Failed to update elapsed time in DB for game ${gameId}`);
            }
          } catch (error) {
            console.error(`Error updating elapsed time in DB for game ${gameId}:`, error);
          }

          // Update money for all players in this game every 10 seconds
          const connectedSockets = Array.from(sockets);
          for (const socketId of connectedSockets) {
            const socket = gameNamespace.sockets.get(socketId);
            if (socket && socket.userId) {
              try {
                // Fetch current money
                const currentMoney = await dbOperations.getUserGameMoney(socket.userId, gameId);
                const newMoney = currentMoney + 1000;

                // Update money in database
                const success = await dbOperations.updateUserGameMoney(socket.userId, gameId, newMoney);

                if (success) {
                  console.log(`Updated money for user ${socket.userId} in game ${gameId}: $${newMoney}`);
                  // Emit money update to this specific user
                  socket.emit('money-update', { userId: socket.userId, newMoney });
                } else {
                  console.error(`Failed to update money for user ${socket.userId} in game ${gameId}`);
                }
              } catch (error) {
                console.error(`Error updating money for user ${socket.userId}:`, error);
              }
            }
          }
        } else {
          console.log(`Game ${gameId} is paused - not incrementing time. Current: ${gameState.elapsedTime}ms`);
        }

        // Update the stored game state
        gameStates.set(gameId, gameState);

        // Emit elapsed time since game started (whether paused or not)
        gameNamespace.to(roomName).emit('time-update', gameState.elapsedTime);
      }
    }
  }, 10000); // 10 seconds

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
    console.log(`User ${socket.userId} connected to game ${socket.gameId}`);

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, { userId: socket.userId, gameId: socket.gameId });
    dbOperations.createUser(socket.userId);

    // Join the game-specific room
    socket.join(`game-${socket.gameId}`);

    // Initialize game state if it doesn't exist, reading elapsed time from database
    if (!gameStates.has(socket.gameId)) {
      try {
        const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(socket.gameId);
        console.log(`Initializing game state for ${socket.gameId} with elapsed time from DB: ${elapsedTimeFromDB}ms`);
        
        gameStates.set(socket.gameId, {
          elapsedTime: elapsedTimeFromDB,
          isGamePaused: false,
          lobbyPlayers: []
        });
      } catch (error) {
        console.error(`Error reading elapsed time from DB for game ${socket.gameId}:`, error);
        // Fallback to default state
        gameStates.set(socket.gameId, {
          elapsedTime: 0,
          isGamePaused: false,
          lobbyPlayers: []
        });
      }
    }

    // Handle franchise placement events
    socket.on('franchise-placed', (franchiseData) => {
      console.log(`Broadcasting franchise placement from user ${socket.userId} in game ${socket.gameId}`);
      console.log(`Broadcasting to room: game-${socket.gameId}`);
      console.log('Franchise data:', franchiseData);

      // Get list of sockets in the room for debugging
      const socketsInRoom = gameNamespace.adapter.rooms.get(`game-${socket.gameId}`);
      console.log(`Sockets in room game-${socket.gameId}:`, socketsInRoom ? socketsInRoom.size : 0);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-added', franchiseData);
      console.log('Franchise-added event broadcasted');
    });

    // Handle franchise removal events
    socket.on('franchise-removed', (franchiseData) => {
      console.log(`Broadcasting franchise removal from user ${socket.userId} in game ${socket.gameId}`);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-removed', franchiseData);
      console.log('Franchise-removed event broadcasted');
    });

    // Handle game pause events
    socket.on('game-paused', async (data) => {
      console.log(`User ${socket.userId} paused game ${socket.gameId}`);

      // Update server game state to paused
      let gameState = gameStates.get(socket.gameId);
      if (!gameState) {
        try {
          const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(socket.gameId);
          gameState = { elapsedTime: elapsedTimeFromDB, isGamePaused: false, lobbyPlayers: [] };
        } catch (error) {
          console.error(`Error reading elapsed time from DB for game ${socket.gameId}:`, error);
          gameState = { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
        }
      }
      
      gameState.isGamePaused = true;
      gameStates.set(socket.gameId, gameState);

      console.log(`Game ${socket.gameId} server state set to paused`);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('game-paused', {
        pausedBy: socket.userId,
        ...data
      });
    });

    // Handle game resume events
    socket.on('game-resumed', async (data) => {
      console.log(`User ${socket.userId} resumed game ${socket.gameId}`);

      // Update server game state to resumed
      let gameState = gameStates.get(socket.gameId);
      if (!gameState) {
        try {
          const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(socket.gameId);
          gameState = { elapsedTime: elapsedTimeFromDB, isGamePaused: false, lobbyPlayers: [] };
        } catch (error) {
          console.error(`Error reading elapsed time from DB for game ${socket.gameId}:`, error);
          gameState = { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
        }
      }
      
      gameState.isGamePaused = false;
      gameStates.set(socket.gameId, gameState);

      console.log(`Game ${socket.gameId} server state set to running`);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('game-resumed', {
        resumedBy: socket.userId,
        ...data
      });
    });

    // Handle player actions (county selection, etc.)
    socket.on('county-selected', (data) => {
      console.log(`User ${socket.userId} selected county in game ${socket.gameId}:`, data);

      // Broadcast county selection to other players
      socket.to(`game-${socket.gameId}`).emit('player-county-selected', {
        userId: socket.userId,
        county: data.county
      });
    });

    // Handle player chat in game
    socket.on('game-chat', (data) => {
      console.log(`Chat message from ${socket.userId} in game ${socket.gameId}: ${data.message}`);

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
          const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(socket.gameId);
          gameState = { elapsedTime: elapsedTimeFromDB, isGamePaused: false, lobbyPlayers: [] };
          gameStates.set(socket.gameId, gameState);
        } catch (error) {
          console.error(`Error reading elapsed time from DB for sync request in game ${socket.gameId}:`, error);
          gameState = { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
          gameStates.set(socket.gameId, gameState);
        }
      }
      
      socket.emit('game-state-sync', {
        elapsedTime: gameState.elapsedTime,
        isGamePaused: gameState.isGamePaused
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from game`);
      userSessions.delete(socket.id);

      // Notify other players that this user left the game
      socket.to(`game-${socket.gameId}`).emit('player-left', {
        userId: socket.userId
      });
    });
  });

  return gameNamespace;
}
