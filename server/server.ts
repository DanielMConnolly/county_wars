import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { dbOperations } from './database.js';
import { setupSocket } from './SetupSocket.js';
import authRoutes from './authRoutes.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Response body parser middleware - converts JSON strings to JavaScript objects
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function(body: any) {
    // Log the response for debugging
    console.log(`📤 Response [${req.method} ${req.path}]:`, {
      statusCode: res.statusCode,
      body: typeof body === 'string' ? parseJsonSafely(body) : body
    });

    // Parse JSON strings in response body recursively
    const parsedBody = parseResponseBody(body);

    return originalJson.call(this, parsedBody);
  };

  next();
});

// Helper function to safely parse JSON strings
function parseJsonSafely(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str; // Return original string if not valid JSON
  }
}

// Recursively parse JSON strings in response body
function parseResponseBody(obj: any): any {
  if (typeof obj === 'string') {
    // Try to parse as JSON
    const parsed = parseJsonSafely(obj);
    return parsed !== obj ? parseResponseBody(parsed) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => parseResponseBody(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = parseResponseBody(value);
    }
    return result;
  }

  return obj;
}

// Database is initialized automatically when imported
console.log('Using SQLite database for data persistence');

// Setup socket connections and handlers
setupSocket(io);

// Authentication routes
app.use('/api/auth', authRoutes);

// HTTP API endpoints
app.get('/api/counties/:userId/:gameId', (req, res) => {
  const { userId, gameId } = req.params;
  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    const ownedCounties = dbOperations.getUserCounties(userId, gameId);
    res.json({ ownedCounties });
  } catch (error) {
    console.error('Error fetching user counties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/counties/all/taken/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const allTakenCounties = dbOperations.getAllTakenCounties(gameId);
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
app.put('/api/users/:userId/highlight-color', function(req: Request, res: Response): void {
  const { userId } = req.params;
  const { color } = req.body;

  if (!color) {
    res.status(400).json({ error: 'Color is required' });
    return;
  }

  // Validate color format (hex color or predefined color names)
  const validColors = [
    'red', 'blue', 'green', 'purple', 'orange', 'pink', 'yellow',
    'teal', 'indigo', 'lime', 'cyan', 'rose'
  ];
  const hexColorRegex = /^#[0-9A-F]{6}$/i;

  if (!validColors.includes(color) && !hexColorRegex.test(color)) {
    res.status(400).json({ error: 'Invalid color format' });
    return;
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
app.put('/api/users/:userId/game-time', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const { gameTime } = req.body;

  if (!gameTime) {
    res.status(400).json({ error: 'Game time is required' });
    return;
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

// Get user money
app.get('/api/users/:userId/money', (req: Request, res: Response): void => {
  const { userId } = req.params;

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    const money = dbOperations.getUserMoney(userId);
    res.json({ money });
  } catch (error) {
    console.error('Error fetching user money:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user money
app.put('/api/users/:userId/money', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const { amount } = req.body;

  if (typeof amount !== 'number') {
    res.status(400).json({ error: 'Amount must be a number' });
    return;
  }

  try {
    // Ensure user exists in database
    dbOperations.createUser(userId);

    // Update the money
    const success = dbOperations.updateUserMoney(userId, amount);

    if (success) {
      res.json({ message: 'Money updated successfully', money: amount });
    } else {
      res.status(500).json({ error: 'Failed to update money' });
    }
  } catch (error) {
    console.error('Error updating money:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Game management endpoints
app.post('/api/games', (req: Request, res: Response): void => {
  const { name, createdBy } = req.body;
  
  if (!name || !createdBy) {
    res.status(400).json({ error: 'Name and createdBy are required' });
    return;
  }

  try {
    const gameId = `game_${Math.random().toString(36).substr(2, 9)}`;
    const success = dbOperations.createGame(gameId, name, createdBy);
    
    if (success) {
      res.json({ gameId, name, createdBy, message: 'Game created successfully' });
    } else {
      res.status(500).json({ error: 'Failed to create game' });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:gameId', (req: Request, res: Response): void => {
  const { gameId } = req.params;
  
  try {
    const game = dbOperations.getGame(gameId);
    
    if (game) {
      res.json(game);
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:userId/games', (req: Request, res: Response): void => {
  const { userId } = req.params;
  
  try {
    const games = dbOperations.getUserGames(userId);
    res.json({ games });
  } catch (error) {
    console.error('Error fetching user games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
