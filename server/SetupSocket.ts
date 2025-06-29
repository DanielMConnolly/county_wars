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
  
  // Store elapsed time for each game (gameId -> elapsedTime)
  const gameElapsedTimes = new Map<string, number>();

  // Set up interval timer to emit elapsed time every 10 seconds
  setInterval(() => {
    // Get all active game rooms
    const rooms = io.sockets.adapter.rooms;
    
    for (const [roomName, sockets] of rooms) {
      // Only process game rooms (that start with 'game-')
      if (roomName.startsWith('game-') && sockets.size > 0) {
        const gameId = roomName.replace('game-', '');
        
        // Get current elapsed time for this game, or initialize to 0
        let elapsedTime = gameElapsedTimes.get(gameId) || 0;
        
        // Increment by 10 seconds (10000ms)
        elapsedTime += 10000;
        
        // Update the stored elapsed time
        gameElapsedTimes.set(gameId, elapsedTime);
        
        console.log(`Emitting elapsed time to ${sockets.size} players in game ${gameId}: ${elapsedTime}ms`);
        
        // Emit elapsed time since game started
        io.to(roomName).emit('time-update', elapsedTime);
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
