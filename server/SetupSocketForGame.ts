import { Server } from 'socket.io';
import { dbOperations } from './database.js';
import type { ServerGameState } from '../src/types/GameTypes.js';

// Game timeline constants
const START_YEAR = 1945;
const END_YEAR = 2025;

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
    gameId: string;
  }
}

// Store game state for each game (gameId -> ServerGameState) - exported for server access
export const gameStates = new Map<string, ServerGameState>();

// Function to start a game timer with dynamic interval based on game duration
export const startGameTimer = async (gameId: string, gameNamespace: any) => {
    const gameDuration = await dbOperations.getGameDuration(gameId);
    if (!gameDuration) {
      console.error(`Could not get game duration for ${gameId}, using default 60 minutes`);
      return;
    }

    // Calculate interval based on game timeline
    const totalGameTimeMs = gameDuration * 60 * 1000; // Convert minutes to milliseconds
    const totalYears = END_YEAR - START_YEAR; // Calculate total years from constants
    const yearDurationMs = totalGameTimeMs / totalYears;


    const timer = setInterval(async () => {
      const roomName = `game-${gameId}`;
      const room = gameNamespace.adapter.rooms.get(roomName);

      // Only process if there are connected players
      if (room && room.size > 0) {
        let gameState = gameStates.get(gameId);
        if (!gameState) {
          try {
            const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(gameId);
            gameState = { elapsedTime: elapsedTimeFromDB, isGamePaused: false, lobbyPlayers: [] };
            gameStates.set(gameId, gameState);
          } catch (error) {
            console.error(`Error reading elapsed time from DB for game ${gameId}:`, error);
            gameState = { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
            gameStates.set(gameId, gameState);
          }
        }

        if (gameState.isGamePaused) return;

        gameState.elapsedTime += yearDurationMs; // Increment by one year's worth of time

        // Update elapsed time in database
        try {
          const dbUpdateSuccess = await dbOperations.updateGameElapsedTime(gameId, gameState.elapsedTime);
          if (dbUpdateSuccess) {
          } else {
            console.error(`Failed to update elapsed time in DB for game ${gameId}`);
          }
        } catch (error) {
          console.error(`Error updating elapsed time in DB for game ${gameId}:`, error);
        }

        // Update money for all players in this game
        const connectedSockets = Array.from(room);
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

        // Update the stored game state
        gameStates.set(gameId, gameState);

        // Emit elapsed time since game started
        gameNamespace.to(roomName).emit('time-update', gameState.elapsedTime);
      } else {
        // No players connected, stop the timer
        clearInterval(timer);
      }
    }, yearDurationMs);
};

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

    // Initialize game state if it doesn't exist, reading elapsed time from database
    if (!gameStates.has(socket.gameId)) {
      try {
        const elapsedTimeFromDB = await dbOperations.getGameElapsedTime(socket.gameId);

        gameStates.set(socket.gameId, {
          elapsedTime: elapsedTimeFromDB,
          isGamePaused: false,
          lobbyPlayers: []
        });

        // Start the game timer for this game
        startGameTimer(socket.gameId, gameNamespace);
      } catch (error) {
        console.error(`Error reading elapsed time from DB for game ${socket.gameId}:`, error);
        // Fallback to default state
        gameStates.set(socket.gameId, {
          elapsedTime: 0,
          isGamePaused: false,
          lobbyPlayers: []
        });

        // Start the game timer even with default state
        startGameTimer(socket.gameId, gameNamespace);
      }
    }

    // Handle franchise removal events
    socket.on('franchise-removed', (franchiseData) => {

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-removed', franchiseData);
    });

    // Handle game pause events
    socket.on('game-paused', async (data) => {

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


      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('game-paused', {
        pausedBy: socket.userId,
        ...data
      });
    });

    // Handle game resume events
    socket.on('game-resumed', async (data) => {

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


      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('game-resumed', {
        resumedBy: socket.userId,
        ...data
      });
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
      userSessions.delete(socket.id);

      // Notify other players that this user left the game
      socket.to(`game-${socket.gameId}`).emit('player-left', {
        userId: socket.userId
      });
    });
  });

  return gameNamespace;
}
