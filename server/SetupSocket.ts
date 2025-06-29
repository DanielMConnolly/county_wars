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

export function setupSocket(io: Server) {
  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

  // Set up interval timer to emit elapsed time every 10 seconds
  setInterval(async () => {
    // Get all active game rooms
    const rooms = io.sockets.adapter.rooms;

    for (const [roomName, sockets] of rooms) {
      // Only process game rooms (that start with 'game-')
      if (roomName.startsWith('game-') && sockets.size > 0) {
        const gameId = roomName.replace('game-', '');

        // Get current game state, or initialize with defaults
        let gameState = gameStates.get(gameId) || { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };

        // Only increment time if game is not paused
        if (!gameState.isGamePaused) {
          gameState.elapsedTime += 10000; // Increment by 10 seconds (10000ms)
          console.log(`Emitting elapsed time to ${sockets.size} players in game ${gameId}: ${gameState.elapsedTime}ms (running)`);

          // Update money for all players in this game every 10 seconds
          const connectedSockets = Array.from(sockets);
          for (const socketId of connectedSockets) {
            const socket = io.sockets.sockets.get(socketId);
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
        io.to(roomName).emit('time-update', gameState.elapsedTime);
      }
    }
  }, 10000); // 10 seconds

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const gameId = socket.handshake.auth.gameId || 'default-game';
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    socket.gameId = gameId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to game ${socket.gameId}`);

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, { userId: socket.userId, gameId: socket.gameId });
    dbOperations.createUser(socket.userId);

    // Join the game-specific room
    socket.join(`game-${socket.gameId}`);

    // Add user to lobby players if not already present
    const addUserToLobby = async () => {
      let gameState = gameStates.get(socket.gameId) || { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
      let playerAdded = false;
      
      // Check if user is already in lobby
      const existingPlayer = gameState.lobbyPlayers.find(player => player.userId === socket.userId);
      if (!existingPlayer) {
        // Get user info from database
        const user = await dbOperations.createUser(socket.userId);
        
        // Determine if this user should be host (first player or if no current host)
        const isHost = gameState.lobbyPlayers.length === 0 || !gameState.lobbyPlayers.some(p => p.isHost);
        
        gameState.lobbyPlayers.push({
          userId: socket.userId,
          username: user.username || socket.userId,
          isHost
        });
        
        gameStates.set(socket.gameId, gameState);
        playerAdded = true;
        
        console.log(`User ${socket.userId} (${user.username}) joined lobby for game ${socket.gameId}`);
      } else {
        console.log(`User ${socket.userId} reconnected to lobby for game ${socket.gameId}`);
      }
      
      // Always broadcast lobby update when someone connects (new or reconnecting)
      io.to(`game-${socket.gameId}`).emit('lobby-updated', {
        players: gameState.lobbyPlayers
      });
      
      if (playerAdded) {
        console.log(`Broadcasted lobby update for new player ${socket.userId} in game ${socket.gameId}`);
      } else {
        console.log(`Broadcasted lobby update for reconnecting player ${socket.userId} in game ${socket.gameId}`);
      }
    };
    
    addUserToLobby();

    // Note: Initial game state sync is now handled via HTTP GET request instead of socket events

    // Handle franchise placement events
    socket.on('franchise-placed', (franchiseData) => {
      console.log(`Broadcasting franchise placement from user ${socket.userId} in game ${socket.gameId}`);
      console.log(`Broadcasting to room: game-${socket.gameId}`);
      console.log('Franchise data:', franchiseData);

      // Get list of sockets in the room for debugging
      const socketsInRoom = io.sockets.adapter.rooms.get(`game-${socket.gameId}`);
      console.log(`Sockets in room game-${socket.gameId}:`, socketsInRoom ? socketsInRoom.size : 0);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-added', franchiseData);
      console.log('Franchise-added event broadcasted');
    });

    // Handle game pause events
    socket.on('game-paused', (data) => {
      console.log(`User ${socket.userId} paused game ${socket.gameId}`);

      // Update server game state to paused
      let gameState = gameStates.get(socket.gameId) || { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
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
    socket.on('game-resumed', (data) => {
      console.log(`User ${socket.userId} resumed game ${socket.gameId}`);

      // Update server game state to resumed
      let gameState = gameStates.get(socket.gameId) || { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
      gameState.isGamePaused = false;
      gameStates.set(socket.gameId, gameState);

      console.log(`Game ${socket.gameId} server state set to running`);

      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('game-resumed', {
        resumedBy: socket.userId,
        ...data
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      userSessions.delete(socket.id);
      
      // Remove user from lobby
      let gameState = gameStates.get(socket.gameId);
      if (gameState && gameState.lobbyPlayers) {
        const initialPlayerCount = gameState.lobbyPlayers.length;
        gameState.lobbyPlayers = gameState.lobbyPlayers.filter(player => player.userId !== socket.userId);
        
        // If the host left, make the first remaining player the new host
        if (gameState.lobbyPlayers.length > 0 && !gameState.lobbyPlayers.some(p => p.isHost)) {
          gameState.lobbyPlayers[0].isHost = true;
        }
        
        gameStates.set(socket.gameId, gameState);
        
        // Only broadcast if someone actually left
        if (gameState.lobbyPlayers.length < initialPlayerCount) {
          console.log(`User ${socket.userId} left lobby for game ${socket.gameId}. Remaining players: ${gameState.lobbyPlayers.length}`);
          
          // Check if a new host was assigned
          const newHost = gameState.lobbyPlayers.find(p => p.isHost);
          if (newHost && gameState.lobbyPlayers.length > 0) {
            console.log(`New host assigned: ${newHost.username} (${newHost.userId})`);
          }
          
          // Broadcast lobby update to remaining players
          io.to(`game-${socket.gameId}`).emit('lobby-updated', {
            players: gameState.lobbyPlayers
          });
          
          console.log(`Broadcasted lobby update for user leaving game ${socket.gameId}`);
        }
      }
    });
  });
}
