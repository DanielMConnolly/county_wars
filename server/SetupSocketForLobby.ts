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

// Store lobby state for each game (gameId -> ServerGameState) - exported for server access
export const lobbyStates = new Map<string, ServerGameState>();

export function setupSocketForLobby(io: Server, namespace = '/lobby') {
  const lobbyNamespace = io.of(namespace);

  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

  // Authentication middleware for socket connections
  lobbyNamespace.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const gameId = socket.handshake.auth.gameId || 'default-game';
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    socket.gameId = gameId;
    next();
  });

  lobbyNamespace.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to lobby for game ${socket.gameId}`);

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, { userId: socket.userId, gameId: socket.gameId });
    dbOperations.createUser(socket.userId);

    // Join the lobby-specific room
    socket.join(`lobby-${socket.gameId}`);

    // Add user to lobby players if not already present
    const addUserToLobby = async () => {
      let gameState = lobbyStates.get(socket.gameId) || { elapsedTime: 0, isGamePaused: false, lobbyPlayers: [] };
      let playerAdded = false;
      
      // Check if user is already in lobby
      const existingPlayer = gameState.lobbyPlayers.find(player => player.userId === socket.userId);
      if (!existingPlayer) {
        // Get user info from database
        const user = await dbOperations.createUser(socket.userId);
        
        // Get game from database to check who created it
        const game = await dbOperations.getGame(socket.gameId);
        const isUserHost = game?.createdBy === socket.userId;
        
        gameState.lobbyPlayers.push({
          userId: socket.userId,
          username: user.username || socket.userId,
          isHost: isUserHost
        });
        
        lobbyStates.set(socket.gameId, gameState);
        playerAdded = true;
        
        console.log(`User ${socket.userId} (${user.username}) joined lobby for game ${socket.gameId}`);
      } else {
        console.log(`User ${socket.userId} reconnected to lobby for game ${socket.gameId}`);
      }
      
      // Always broadcast lobby update when someone connects (new or reconnecting)
      lobbyNamespace.to(`lobby-${socket.gameId}`).emit('lobby-updated', {
        players: gameState.lobbyPlayers
      });
      
      if (playerAdded) {
        console.log(`Broadcasted lobby update for new player ${socket.userId} in game ${socket.gameId}`);
      } else {
        console.log(`Broadcasted lobby update for reconnecting player ${socket.userId} in game ${socket.gameId}`);
      }
    };
    
    addUserToLobby();

    // Handle game start event (only host can start)
    socket.on('start-game', async (data) => {
      const gameState = lobbyStates.get(socket.gameId);
      const user = gameState?.lobbyPlayers.find(p => p.userId === socket.userId);
      
      if (user?.isHost) {
        console.log(`Host ${socket.userId} starting game ${socket.gameId}`);
        
        // Update game status in database
        await dbOperations.updateGameStatus(socket.gameId, 'LIVE');
        
        // Add all lobby players to the GameUser table
        if (gameState?.lobbyPlayers && gameState.lobbyPlayers.length > 0) {
          const userIds = gameState.lobbyPlayers.map(player => player.userId);
          const success = await dbOperations.addUsersToGame(userIds, socket.gameId);
          
          if (success) {
            console.log(`Added ${userIds.length} players to GameUser table for game ${socket.gameId}:`, userIds);
          } else {
            console.error(`Failed to add players to GameUser table for game ${socket.gameId}`);
          }
        }
        
        // Broadcast to all players in lobby that game is starting
        lobbyNamespace.to(`lobby-${socket.gameId}`).emit('game-starting', {
          gameId: socket.gameId,
          startedBy: socket.userId,
          players: gameState?.lobbyPlayers || []
        });
        
        console.log(`Game ${socket.gameId} started by host ${socket.userId}`);
      } else {
        console.log(`Non-host user ${socket.userId} attempted to start game ${socket.gameId}`);
        socket.emit('error', { message: 'Only the host can start the game' });
      }
    });

    // Handle player ready/unready status
    socket.on('player-ready', (data) => {
      const gameState = lobbyStates.get(socket.gameId);
      if (gameState) {
        const player = gameState.lobbyPlayers.find(p => p.userId === socket.userId);
        if (player) {
          player.isReady = data.isReady;
          lobbyStates.set(socket.gameId, gameState);
          
          // Broadcast updated lobby state
          lobbyNamespace.to(`lobby-${socket.gameId}`).emit('lobby-updated', {
            players: gameState.lobbyPlayers
          });
          
          console.log(`Player ${socket.userId} is now ${data.isReady ? 'ready' : 'not ready'} in game ${socket.gameId}`);
        }
      }
    });

    // Handle chat messages in lobby
    socket.on('lobby-chat', (data) => {
      const gameState = lobbyStates.get(socket.gameId);
      const user = gameState?.lobbyPlayers.find(p => p.userId === socket.userId);
      
      if (user) {
        const chatMessage = {
          userId: socket.userId,
          username: user.username,
          message: data.message,
          timestamp: Date.now()
        };
        
        // Broadcast chat message to all players in lobby
        lobbyNamespace.to(`lobby-${socket.gameId}`).emit('lobby-chat-message', chatMessage);
        
        console.log(`Chat message from ${user.username} in lobby ${socket.gameId}: ${data.message}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from lobby`);
      userSessions.delete(socket.id);
      
      // Remove user from lobby
      let gameState = lobbyStates.get(socket.gameId);
      if (gameState && gameState.lobbyPlayers) {
        const initialPlayerCount = gameState.lobbyPlayers.length;
        gameState.lobbyPlayers = gameState.lobbyPlayers.filter(player => player.userId !== socket.userId);
        
        // If the host left, make the first remaining player the new host
        if (gameState.lobbyPlayers.length > 0 && !gameState.lobbyPlayers.some(p => p.isHost)) {
          gameState.lobbyPlayers[0].isHost = true;
        }
        
        lobbyStates.set(socket.gameId, gameState);
        
        // Only broadcast if someone actually left
        if (gameState.lobbyPlayers.length < initialPlayerCount) {
          console.log(`User ${socket.userId} left lobby for game ${socket.gameId}. Remaining players: ${gameState.lobbyPlayers.length}`);
          
          // Check if a new host was assigned
          const newHost = gameState.lobbyPlayers.find(p => p.isHost);
          if (newHost && gameState.lobbyPlayers.length > 0) {
            console.log(`New host assigned: ${newHost.username} (${newHost.userId})`);
          }
          
          // Broadcast lobby update to remaining players
          lobbyNamespace.to(`lobby-${socket.gameId}`).emit('lobby-updated', {
            players: gameState.lobbyPlayers
          });
          
          console.log(`Broadcasted lobby update for user leaving game ${socket.gameId}`);
        }
      }
    });
  });

  return lobbyNamespace;
}