import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { dbOperations } from './database.js';

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Vite dev server
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active user sessions
const userSessions = new Map(); // socketId -> userId

// Database is initialized automatically when imported
console.log('Using SQLite database for data persistence');

// Authentication middleware for socket connections
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  socket.userId = userId;
  next();
});

// HTTP API endpoints
app.get('/api/counties/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    const ownedCounties = dbOperations.getUserCounties(userId);
    res.json({ ownedCounties });
  } catch (error) {
    console.error('Error fetching user counties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/counties/all/taken', (_, res) => {
  try {
    const allTakenCounties = dbOperations.getAllTakenCounties();
    res.json(allTakenCounties);
  } catch (error) {
    console.error('Error fetching all taken counties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', (_, res) => {
  try {
    const stats = dbOperations.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user highlight color
app.put('/api/users/:userId/highlight-color', (req, res) => {
  const { userId } = req.params;
  const { color } = req.body;

  if (!color) {
    return res.status(400).json({ error: 'Color is required' });
  }

  // Validate color format (hex color or predefined color names)
  const validColors = [
    'red', 'blue', 'green', 'purple', 'orange', 'pink', 'yellow',
    'teal', 'indigo', 'lime', 'cyan', 'rose'
  ];
  const hexColorRegex = /^#[0-9A-F]{6}$/i;

  if (!validColors.includes(color) && !hexColorRegex.test(color)) {
    return res.status(400).json({ error: 'Invalid color format' });
  }

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    // Update the highlight color
    const success = dbOperations.updateUserHighlightColor(userId, color);

    if (success) {
      res.json({ message: 'Highlight color updated successfully', color });
    } else {
      res.status(500).json({ error: 'Failed to update highlight color' });
    }
  } catch (error) {
    console.error('Error updating highlight color:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user highlight color
app.get('/api/users/:userId/highlight-color', (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    const color = dbOperations.getUserHighlightColor(userId);
    res.json({ color });
  } catch (error) {
    console.error('Error fetching highlight color:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user game time
app.get('/api/users/:userId/game-time', (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    const gameTime = dbOperations.getUserGameTime(userId);
    res.json({ gameTime });
  } catch (error) {
    console.error('Error fetching game time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user game time
app.put('/api/users/:userId/game-time', (req, res) => {
  const { userId } = req.params;
  const { gameTime } = req.body;

  if (!gameTime) {
    return res.status(400).json({ error: 'Game time is required' });
  }

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    // Update the game time
    const success = dbOperations.updateUserGameTime(userId, gameTime);

    if (success) {
      res.json({ message: 'Game time updated successfully', gameTime });
    } else {
      res.status(500).json({ error: 'Failed to update game time' });
    }
  } catch (error) {
    console.error('Error updating game time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
