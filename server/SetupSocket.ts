import { Server } from 'socket.io';
import { dbOperations } from './database.js';

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}

export function setupSocket(io: Server) {
  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, socket.userId);
    dbOperations.createUser(socket.userId);

    // Handle county ownership changes
    socket.on('claim-county', (data) => {
      try {
        console.log('Received claim-county request:', data);
        const { countyName } = data;
        const userId = socket.userId;

        if (!countyName) {
          socket.emit('error', { message: 'County name is required' });
          return;
        }

        // Attempt to claim the county using database
        const success = dbOperations.claimCounty(userId, countyName);

        if (!success) {
          socket.emit('error', { message: 'County is already owned by another player' });
          return;
        }

        // Notify the user
        socket.emit('county-claimed', { countyName });

        // Broadcast to all other users that this county is now taken
        socket.broadcast.emit('county-taken', { countyName, userId });

        console.log(`User ${userId} successfully claimed county: ${countyName}`);
      } catch (error) {
        console.error('Error handling claim-county:', error);
        socket.emit('error', { message: 'Server error while claiming county' });
      }
    });

    // Handle county release
    socket.on('release-county', (data) => {
      try {
        const { countyName } = data;
        const userId = socket.userId;

        if (!countyName) {
          socket.emit('error', { message: 'County name is required' });
          return;
        }

        // Attempt to release the county using database
        const success = dbOperations.releaseCounty(userId, countyName);

        if (!success) {
          socket.emit('error', { message: 'You do not own this county' });
          return;
        }

        // Notify the user
        socket.emit('county-released', { countyName });

        // Broadcast to all other users that this county is now available
        socket.broadcast.emit('county-available', { countyName });

        console.log(`User ${userId} released county: ${countyName}`);
      } catch (error) {
        console.error('Error handling release-county:', error);
        socket.emit('error', { message: 'Server error while releasing county' });
      }
    });

    // Get all owned counties for a user
    socket.on('get-owned-counties', () => {
      try {
        const userId = socket.userId;
        const ownedCounties = dbOperations.getUserCounties(userId);
        socket.emit('owned-counties', { ownedCounties });
      } catch (error) {
        console.error('Error getting owned counties:', error);
        socket.emit('error', { message: 'Server error while fetching counties' });
      }
    });

    // Get all taken counties (for display purposes)
    socket.on('get-all-taken-counties', () => {
      try {
        const allTakenCounties = dbOperations.getAllTakenCounties();
        socket.emit('all-taken-counties', allTakenCounties);
      } catch (error) {
        console.error('Error getting all taken counties:', error);
        socket.emit('error', { message: 'Server error while fetching counties' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      userSessions.delete(socket.id);
    });
  });
}