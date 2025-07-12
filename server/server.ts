import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbOperations, initDatabase } from './database.js';
import { setupSocketForLobby, lobbyStates } from './SetupSocketForLobby.js';
import { setupSocketForGame, gameStates } from './SetupSocketForGame.js';
import authRoutes from './authRoutes.js';
import { getGeoDataFromCoordinates } from './metroAreaUtils';
import { getFranchiseCost } from './calculateCosts.js';
import { VALID_COLOR_NAMES } from '../src/constants/gameDefaults.js';
import { Franchise } from '../src/types/GameTypes.js';
import { setupFranchiseEndpoints } from './FranchiseEndpoints.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? true : true,
    credentials: true,
  })
);
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// Response body parser middleware - converts JSON strings to JavaScript objects
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    // Log the response for debugging
    console.log(`📤 Response [${req.method} ${req.path}]:`, {
      statusCode: res.statusCode,
      body: typeof body === 'string' ? parseJsonSafely(body) : body,
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

// Setup socket connections and handlers
// Setup both lobby and game socket namespaces
setupSocketForLobby(io, '/lobby');
setupSocketForGame(io, '/game');

// Setup general welcome screen socket for real-time game updates
const welcomeNamespace = io.of('/');
welcomeNamespace.on('connection', socket => {
  console.log('Client connected to welcome socket');

  socket.on('disconnect', () => {
    console.log('Client disconnected from welcome socket');
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Setup franchise-related endpoints
setupFranchiseEndpoints(app, io);

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

// Get user's stats by turn for a specific game
app.get('/api/games/:gameId/users/:userId/stats-by-turn', async (req: Request, res: Response): Promise<void> => {
  const { gameId, userId } = req.params;

  try {
    const stats = await dbOperations.getStatsByTurnForUser(userId, gameId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching user stats by turn:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all players' stats by turn for a specific game
app.get('/api/games/:gameId/stats-by-turn', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    const stats = await dbOperations.getStatsByTurnForGame(gameId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching game stats by turn:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create/update stats by turn for a user in a game
app.post('/api/games/:gameId/users/:userId/stats-by-turn', async (req: Request, res: Response): Promise<void> => {
  const { gameId, userId } = req.params;
  const { turnNumber, incomeReceived, totalMoney, totalFranchises } = req.body;

  if (typeof turnNumber !== 'number' || typeof incomeReceived !== 'number' || 
      typeof totalMoney !== 'number' || typeof totalFranchises !== 'number') {
    res.status(400).json({ success: false, error: 'All numeric fields are required' });
    return;
  }

  try {
    const success = await dbOperations.createStatsByTurn(
      userId, 
      gameId, 
      turnNumber, 
      incomeReceived, 
      totalMoney, 
      totalFranchises
    );
    
    if (success) {
      res.json({ success: true, message: 'Stats recorded successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to record stats' });
    }
  } catch (error) {
    console.error('Error recording stats by turn:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update user highlight color
app.put(
  '/api/users/:userId/highlight-color',
  async function (req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { color } = req.body;

    if (!color) {
      res.status(400).json({ error: 'Color is required' });
      return;
    }

    // Validate color format (hex color or predefined color names)
    const hexColorRegex = /^#[0-9A-F]{6}$/i;

    if (!VALID_COLOR_NAMES.includes(color.toLowerCase()) && !hexColorRegex.test(color)) {
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
  }
);

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

// Get user money for a specific game
app.get(
  '/api/users/:userId/games/:gameId/money',
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

// Update user money for a specific game
app.put(
  '/api/users/:userId/games/:gameId/money',
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

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
      // Get the created game details to broadcast
      const game = await dbOperations.getGame(gameId);

      // Broadcast new game to all welcome screen clients
      if (game) {
        welcomeNamespace.emit('game-created', game);
        console.log(`Broadcasted new game creation: ${gameId}`);
      }

      res.json({ gameId, createdBy, message: 'Game created successfully' });
    } else {
      res.status(500).json({ error: 'Failed to create game' });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:gameId/state', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;

  try {
    // Get current game state from socket server
    const gameState = gameStates.get(gameId);
    const players = await dbOperations.getGamePlayersWithMoney(gameId);

    if (gameState) {
      res.json({
        players: players.map(player => player.userId),
        turnNumber: gameState.turnNumber,
        playerWhosTurnItIs: gameState.playerWhosTurnItIs,
      });
    } else {
      // No game state exists yet, return defaults
      res.json({
        gameId,
        turnNumber: 1,
        playerWhosTurnItIs: null,
      });
    }
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/clicked-location-data', async (req: Request, res: Response): Promise<void> => {
  const lat = req.query.lat as unknown as number;
  const lon = req.query.lng as unknown as number;

  if (!lat || !lon) {
    res.status(400).json({ error: 'lat and lng are required query parameters.' });
    return;
  }

  try {
    const locationData = await getGeoDataFromCoordinates(lat, lon);
    if (!locationData) {
      res.status(404).json({ error: 'Location data not found' });
      return;
    }

    const { county, metroArea, state } = locationData;

    // Get population and cost data from Overpass API
    const populationData = await getFranchiseCost(lat, lon);
    const population = populationData.population;
    const franchisePlacementCost = populationData.cost;

    res.json({
      county: county,
      metroAreaName: metroArea,
      state: state,
      population: population,
      franchisePlacementCost: franchisePlacementCost,
    });
  } catch (error) {
    console.error('Error fetching clicked location data:', error);
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
    // Get game from database to check who created it
    const game = await dbOperations.getGame(gameId);
    const isUserHost = game?.createdBy === userId;

    // Get current lobby state from lobby socket server
    let gameState = lobbyStates.get(gameId);

    if (!gameState) {
      // No game state exists yet, create one and add the requesting user
      console.log(`Creating new game state for game ${gameId} with initial player ${userId}`);

      // Get user info from database
      const user = await dbOperations.createUser(userId);

      gameState = {
        turnNumber: 1,
        playerWhosTurnItIs: null,
        lobbyPlayers: [
          {
            userId: userId,
            username: user.username || userId,
            isHost: isUserHost, // Check if user is the game creator
          },
        ],
      };

      lobbyStates.set(gameId, gameState);

      // Broadcast lobby update to all players in the lobby room
      io.of('/lobby').to(`lobby-${gameId}`).emit('lobby-updated', {
        players: gameState.lobbyPlayers,
      });
    } else {
      // Game state exists, check if user is already in lobby
      const existingPlayer = gameState.lobbyPlayers.find(player => player.userId === userId);
      if (!existingPlayer) {
        // Add user to existing lobby if not already present
        const user = await dbOperations.createUser(userId);

        gameState.lobbyPlayers.push({
          userId: userId,
          username: user.username || userId,
          isHost: isUserHost, // Check if user is the game creator
        });

        lobbyStates.set(gameId, gameState);

        io.of('/lobby').to(`lobby-${gameId}`).emit('lobby-updated', {
          players: gameState.lobbyPlayers,
        });
      }
    }

    res.json({
      gameId,
      players: gameState.lobbyPlayers,
    });
  } catch (error) {
    console.error('Error fetching/initializing lobby state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all players in a game with their money for standings
app.get('/api/games/:gameId/players', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;
  try {
    const players = await dbOperations.getGamePlayersWithMoney(gameId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching game players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/games', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;

  try {
    let games;
    if (status === 'DRAFT') {
      games = await dbOperations.getDraftGames();
    } else {
      games = await dbOperations.getAllGames();
    }

    if (games) {
      res.json({ games });
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
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

app.get('/api/users/:userId/live-games', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const games = await dbOperations.getUserLiveGames(userId);
    res.json({ games });
  } catch (error) {
    console.error('Error fetching user live games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/games/:gameId', async (req: Request, res: Response): Promise<void> => {
  const { gameId } = req.params;
  try {
    const success = await dbOperations.deleteGame(gameId);
    if (success) {
      welcomeNamespace.emit('game-deleted', { gameId });
      res.json({ message: 'Game deleted successfully' });
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error deleting game:', error);
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

// Initialize database before starting server
initDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
