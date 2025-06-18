import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { dbOperations } from './database.js';
import { setupSocket } from './SetupSocket.js';

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

// Database is initialized automatically when imported
console.log('Using SQLite database for data persistence');

// Setup socket connections and handlers
setupSocket(io);

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



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
