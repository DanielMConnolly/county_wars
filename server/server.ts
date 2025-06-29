import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbOperations } from './database.js';
import { setupSocket, gameStates } from './SetupSocket.js';
import authRoutes from './authRoutes.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true
}));
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

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
app.put('/api/users/:userId/highlight-color', async function(req: Request, res: Response): Promise<void> {
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
    await dbOperations.createUser(userId);

    // Update the highlight color
    const success = await dbOperations.updateUserHighlightColor(userId, color);

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
app.get('/api/users/:userId/highlight-color', async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure user exists in database
    await dbOperations.createUser(userId);

    const color = await dbOperations.getUserHighlightColor(userId);
    res.json({ color });
  } catch (error) {
    console.error('Error fetching highlight color:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user game time
app.get('/api/games/:gameID/game-time', async (req, res) => {
  const { gameID } = req.params;
  try {
    const gameTime = await dbOperations.getGameElapsedTime(gameID);
    res.json({ gameTime });
  } catch (error) {
    console.error('Error fetching game time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user money for a specific game
app.get('/api/users/:userId/games/:gameId/money', async (req: Request, res: Response): Promise<void> => {
  const { userId, gameId } = req.params;

  try {
    // Ensure user exists in database
    await dbOperations.createUser(userId);

    const money = await dbOperations.getUserGameMoney(userId, gameId);
    res.json({ money });
  } catch (error) {
    console.error('Error fetching user game money:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user money for a specific game
app.put('/api/users/:userId/games/:gameId/money', async (req: Request, res: Response): Promise<void> => {
  const { userId, gameId } = req.params;
  const { amount } = req.body;

  if (typeof amount !== 'number') {
    res.status(400).json({ error: 'Amount must be a number' });
    return;
  }

  try {
    // Ensure user exists in database
    await dbOperations.createUser(userId);

    // Update the money
    const success = await dbOperations.updateUserGameMoney(userId, gameId, amount);

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
app.post('/api/games', async (req: Request, res: Response): Promise<void> => {
  const { createdBy } = req.body;

  if (!createdBy) {
    res.status(400).json({ error: 'createdBy is required' });
    return;
  }

  try {
    const gameId = `game_${Math.random().toString(36).substr(2, 9)}`;
    const success = await dbOperations.createGame(gameId, createdBy);

    if (success) {
      res.json({ gameId, createdBy, message: 'Game created successfully' });
    } else {
      res.status(500).json({ error: 'Failed to create game' });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/games/:gameId/start', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    const success = await dbOperations.updateGameStatus(gameId, 'LIVE');

    if (success) {
      res.json({ gameId, status: 'LIVE', message: 'Game started successfully' });
    } else {
      res.status(500).json({ error: 'Failed to start game' });
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:gameId/state', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    // Get current game state from socket server
    const gameState = gameStates.get(gameId);

    if (gameState) {
      res.json({
        gameId,
        elapsedTime: gameState.elapsedTime,
        isPaused: gameState.isGamePaused
      });
    } else {
      // No game state exists yet, return defaults
      res.json({
        gameId,
        elapsedTime: 0,
        isPaused: false
      });
    }
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:gameId/lobby', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }

  try {
    // Get current game state from socket server
    let gameState = gameStates.get(gameId);

    if (!gameState) {
      // No game state exists yet, create one and add the requesting user
      console.log(`Creating new game state for game ${gameId} with initial player ${userId}`);
      
      // Get user info from database
      const user = await dbOperations.createUser(userId);
      
      gameState = {
        elapsedTime: 0,
        isGamePaused: false,
        lobbyPlayers: [{
          userId: userId,
          username: user.username || userId,
          isHost: true // First player becomes host
        }]
      };
      
      gameStates.set(gameId, gameState);
      console.log(`Initialized game state for ${gameId} with host ${user.username} (${userId})`);
      
      // Broadcast lobby update to all players in the game room
      io.to(`game-${gameId}`).emit('lobby-updated', {
        players: gameState.lobbyPlayers
      });
      console.log(`Broadcasted initial lobby state for game ${gameId}`);
    } else {
      // Game state exists, check if user is already in lobby
      const existingPlayer = gameState.lobbyPlayers.find(player => player.userId === userId);
      if (!existingPlayer) {
        // Add user to existing lobby if not already present
        const user = await dbOperations.createUser(userId);
        
        gameState.lobbyPlayers.push({
          userId: userId,
          username: user.username || userId,
          isHost: false // Additional players are not hosts
        });
        
        gameStates.set(gameId, gameState);
        console.log(`Added player ${user.username} (${userId}) to existing lobby for game ${gameId}`);
        
        // Broadcast lobby update to all players in the game room
        io.to(`game-${gameId}`).emit('lobby-updated', {
          players: gameState.lobbyPlayers
        });
        console.log(`Broadcasted lobby update for new player in game ${gameId}`);
      }
    }

    res.json({
      gameId,
      players: gameState.lobbyPlayers
    });
  } catch (error) {
    console.error('Error fetching/initializing lobby state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games', async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;
    
    try{
        let games;
        if (status === 'DRAFT') {
            games = await dbOperations.getDraftGames();
        } else {
            games = await dbOperations.getAllGames();
        }
        
        if(games){
            res.json({ games });
        }
        else {
          res.status(404).json({ error: 'Game not found' });
        }
    }
    catch(error){
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

app.get('/api/games/:gameId', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    const game = await dbOperations.getGame(gameId);

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

app.get('/api/users/:userId/games', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const games = await dbOperations.getUserGames(userId);
    res.json({ games });
  } catch (error) {
    console.error('Error fetching user games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/games/:gameId', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    const success = await dbOperations.deleteGame(gameId);

    if (success) {
      res.json({ message: 'Game deleted successfully' });
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// County cost calculation (duplicated from client-side utils)
const COUNTY_COSTS = {
  'EASY': 100,
  'MEDIUM': 200,
  'HARD': 300
};

function calculateCountyDifficulty(countyName: string): 'EASY' | 'MEDIUM' | 'HARD' {
  let hash = 0;
  for (let i = 0; i < countyName.length; i++) {
    const char = countyName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const absHash = Math.abs(hash);
  const remainder = absHash % 3;

  switch (remainder) {
    case 0: return 'EASY';
    case 1: return 'MEDIUM';
    case 2: return 'HARD';
    default: return 'MEDIUM';
  }
}

function getCountyCost(countyName: string): number {
  const difficulty = calculateCountyDifficulty(countyName);
  return COUNTY_COSTS[difficulty];
}

// Franchise management endpoints
app.post('/api/franchises', async (req: Request, res: Response): Promise<void> => {
  const { userId, gameId, lat, long, name, countyName } = req.body;

  if (!userId || !gameId || lat === undefined || long === undefined || !name || !countyName) {
    res.status(400).json({ error: 'userId, gameId, lat, long, name, and countyName are required' });
    return;
  }

  if (typeof lat !== 'number' || typeof long !== 'number') {
    res.status(400).json({ error: 'lat and long must be numbers' });
    return;
  }

  try {
    // Check if game is paused
    const gameState = gameStates.get(gameId);
    if (gameState && gameState.isGamePaused) {
      res.status(400).json({ error: 'Cannot place franchise while game is paused' });
      return;
    }

    // Calculate franchise cost
    const franchiseCost = getCountyCost(countyName);

    // Check if user has enough money in this game
    const userMoney = await dbOperations.getUserGameMoney(userId, gameId);
    if (userMoney < franchiseCost) {
      res.status(400).json({ error: 'Insufficient funds to place franchise' });
      return;
    }

    // Deduct money and place franchise in a transaction-like manner
    const moneyDeducted = await dbOperations.deductUserGameMoney(userId, gameId, franchiseCost);
    if (!moneyDeducted) {
      res.status(400).json({ error: 'Failed to deduct money - insufficient funds' });
      return;
    }

    const franchisePlaced = await dbOperations.placeFranchise(userId, gameId, lat, long, name);
    if (!franchisePlaced) {
      // If franchise placement failed, refund the money
      const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
      await dbOperations.updateUserGameMoney(userId, gameId, currentMoney + franchiseCost);
      res.status(500).json({ error: 'Failed to place franchise' });
      return;
    }

    // Get the updated money amount after franchise placement
    const remainingMoney = await dbOperations.getUserGameMoney(userId, gameId);

    // Emit money update to the specific user via socket
    const userSockets = Array.from(io.sockets.sockets.values()).filter(socket => 
      socket.userId === userId && socket.gameId === gameId
    );
    
    userSockets.forEach(socket => {
      socket.emit('money-update', { userId, newMoney: remainingMoney });
      console.log(`Emitted money update to user ${userId}: $${remainingMoney}`);
    });

    res.json({
      message: 'Franchise placed successfully',
      cost: franchiseCost,
      remainingMoney
    });
  } catch (error) {
    console.error('Error placing franchise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/games/:gameId/franchises', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    const franchises = await dbOperations.getGameFranchises(gameId);
    res.json({ franchises });
  } catch (error) {
    console.error('Error fetching game franchises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/franchises/:franchiseId', async (req: Request, res: Response): Promise<void> => {
  const { franchiseId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const franchiseIdNum = parseInt(franchiseId, 10);
  if (isNaN(franchiseIdNum)) {
    res.status(400).json({ error: 'franchiseId must be a valid number' });
    return;
  }

  try {
    const success = await dbOperations.removeFranchise(franchiseIdNum, userId);

    if (success) {
      res.json({ message: 'Franchise removed successfully' });
    } else {
      res.status(404).json({ error: 'Franchise not found or not owned by user' });
    }
  } catch (error) {
    console.error('Error removing franchise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all handler for React Router in production
if (process.env.NODE_ENV === 'production') {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
