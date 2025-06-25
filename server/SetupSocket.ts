import { Server } from 'socket.io';
import { dbOperations } from './database.js';

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
    gameId: string;
  }
}

export function setupSocket(io: Server) {
  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      userSessions.delete(socket.id);
    });
  });
}
