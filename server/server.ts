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
import { getDistributionCost, getFranchiseCost, getPopulationCost } from './calculateCosts.js';
import { VALID_COLOR_NAMES } from '../src/constants/gameDefaults.js';
import { Franchise } from '../src/types/GameTypes.js';
import { calculateIncomeForFranchise, calculateTotalIncomeForPlayer } from './incomeUtils.js';

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

// Get distribution center cost for a specific user and game
app.get(
  '/api/games/:gameId/distribution-center-cost',
  async (req: Request, res: Response): Promise<void> => {
    const { gameId } = req.params;
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }

    try {
      // Check if this would be the user's first distribution center
      const existingLocations = await dbOperations.getGameFranchises(gameId);
      const userDistributionCenters = existingLocations.filter(
        location => location.locationType === 'distribution-center' && location.userId === userId
      );
      const isFirstDistributionCenter = userDistributionCenters.length === 0;
      const cost = isFirstDistributionCenter ? 0 : 10000;

      res.json({
        cost,
        isFirstDistributionCenter,
        existingDistributionCenters: userDistributionCenters.length,
      });
    } catch (error) {
      console.error('Error fetching distribution center cost:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

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

app.get(
  '/api/games/:gameId/users/:userId/franchise-income',
  async (req: Request, res: Response): Promise<void> => {
    const { gameId, userId } = req.params;

    try {
      const franchises = await dbOperations.getUserGameFranchises(userId, gameId);

      const franchiseIncome = franchises.map(franchise => ({
        id: franchise.id,
        name: franchise.name,
        income: calculateIncomeForFranchise(franchise),
      }));

      const totalIncome = await calculateTotalIncomeForPlayer(userId, gameId);

      res.json({
        franchises: franchiseIncome,
        totalIncome,
      });
    } catch (error) {
      console.error('Error fetching franchise income:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

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

// Location management endpoints (franchises and distribution centers)
app.post('/api/franchises', async (req: Request, res: Response): Promise<void> => {
  const { userId, gameId, lat, long, name, locationType = 'franchise', population } = req.body;
  if (!userId || !gameId || lat === undefined || long === undefined || !name) {
    res.status(400).json({ error: 'userId, gameId, lat, long, and name are required' });
    return;
  }

  if (typeof lat !== 'number' || typeof long !== 'number') {
    res.status(400).json({ error: 'lat and long must be numbers' });
    return;
  }

  try {
    const geoData = await getGeoDataFromCoordinates(lat, long);
    const { county, state, metroArea } = geoData || {};
    if (!geoData) {
      res.status(400).json({ error: 'Unable to determine location data for placement' });
      return;
    }

    let placementCost: number;
    if (locationType === 'distributionCenter') {
      // Get all existing locations for this game to check distribution centers
      const existingLocations = await dbOperations.getGameFranchises(gameId);
      const userDistributionCenters = existingLocations.filter(
        location => location.locationType === 'distribution-center' && location.userId === userId
      );
      placementCost = getDistributionCost(userDistributionCenters.length);
    } else {
      placementCost = await getFranchiseCost(lat, long).then(data => data.cost ?? 0);
    }

    // Check if user has enough money in this game
    const userMoney = await dbOperations.getUserGameMoney(userId, gameId);
    if (userMoney < placementCost) {
      res.status(400).json({ error: 'Insufficient funds to place location' });
      return;
    }

    // Deduct money and place location in a transaction-like manner (only if cost > 0)
    let moneyDeducted = true;
    if (placementCost > 0) {
      moneyDeducted = await dbOperations.deductUserGameMoney(userId, gameId, placementCost);
      if (!moneyDeducted) {
        res.status(400).json({ error: 'Failed to deduct money - insufficient funds' });
        return;
      }
    }

    // Validate franchise placement rules (only for franchises, not distribution centers)
    if (locationType === 'franchise') {
      try {
        // Get all existing locations for this game
        const existingLocations = await dbOperations.getGameFranchises(gameId);

        // Check distribution center requirement (500-mile rule)
        const userDistributionCenters = existingLocations.filter(
          location => location.locationType === 'distribution-center' && location.userId === userId
        );

        if (userDistributionCenters.length === 0) {
          res
            .status(400)
            .json({ error: 'Must build a distribution center before placing franchises' });
          return;
        }
      } catch (validationError) {
        console.error('❌ Validation error:', validationError);
        res.status(500).json({ error: 'Failed to validate franchise placement' });
        return;
      }
    }

    let franchise;
    try {
      franchise = await dbOperations.placeFranchise(
        userId,
        gameId,
        lat,
        long,
        name,
        county,
        state,
        metroArea,
        locationType,
        population
      );
    } catch (error) {
      console.error('❌ Error in placeFranchise:', error);
      // If location placement failed, refund the money (only if money was deducted)
      if (placementCost > 0) {
        const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
        await dbOperations.updateUserGameMoney(userId, gameId, currentMoney + placementCost);
      }
      res.status(500).json({ error: 'Database error: ' + (error as Error).message });
      return;
    }

    if (!franchise) {
      // If location placement failed, refund the money (only if money was deducted)
      if (placementCost > 0) {
        const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
        await dbOperations.updateUserGameMoney(userId, gameId, currentMoney + placementCost);
      }
      res.status(500).json({ error: 'Failed to place location' });
      return;
    }

    // Get the updated money amount after franchise placement
    const remainingMoney = await dbOperations.getUserGameMoney(userId, gameId);

    io.of('/game').to(`game-${gameId}`).emit('location-added', franchise);

    // Emit money update to the specific user via socket
    const userSockets = Array.from(io.sockets.sockets.values()).filter(
      socket => socket.userId === userId && socket.gameId === gameId
    );

    userSockets.forEach(socket => {
      socket.emit('money-update', { userId, newMoney: remainingMoney });
      console.log(`Emitted money update to user ${userId}: $${remainingMoney}`);
    });

    res.json({
      message: 'Location placed successfully',
      cost: placementCost,
      remainingMoney,
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

    // Backfill location data for franchises that don't have it
    for (const franchise of franchises) {
      if (!franchise.county && !franchise.state && !franchise.metroArea) {
        try {
          const geoData = await getGeoDataFromCoordinates(franchise.lat, franchise.long);
          if (geoData) {
            const updated = await dbOperations.updateFranchiseLocation(
              parseInt(franchise.id),
              geoData.county || undefined,
              geoData.state || undefined,
              geoData.metroArea || undefined
            );
            if (updated) {
              // Update the franchise object for this response
              franchise.county = geoData.county;
              franchise.state = geoData.state;
              franchise.metroArea = geoData.metroArea;
            }
          }
        } catch (error) {
          console.error(`Failed to backfill location for franchise ${franchise.id}:`, error);
        }
      }
    }

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

  try {
    const success = await dbOperations.removeFranchise(franchiseId, userId);

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

// Distribution center placement endpoint
app.post('/api/distribution-centers', async (req: Request, res: Response): Promise<void> => {
  const { userId, gameId, lat, long, name } = req.body;

  if (!userId || !gameId || lat === undefined || long === undefined || !name) {
    res.status(400).json({ error: 'userId, gameId, lat, long, and name are required' });
    return;
  }

  if (typeof lat !== 'number' || typeof long !== 'number') {
    res.status(400).json({ error: 'lat and long must be numbers' });
    return;
  }

  try {
    const geoData = await getGeoDataFromCoordinates(lat, long);
    const { county, state, metroArea } = geoData || {};
    if (!geoData) {
      res.status(400).json({ error: 'Unable to determine location data for placement' });
      return;
    }

    // Check if this is the user's first distribution center (first one is free)
    const existingLocations = await dbOperations.getGameFranchises(gameId);
    const userDistributionCenters = existingLocations.filter(
      location => location.locationType === 'distribution-center' && location.userId === userId
    );
    const isFirstDistributionCenter = userDistributionCenters.length === 0;
    const distributionCenterCost = isFirstDistributionCenter ? 0 : 10000;

    // Check if user has enough money in this game
    const userMoney = await dbOperations.getUserGameMoney(userId, gameId);
    if (userMoney < distributionCenterCost) {
      res.status(400).json({ error: 'Insufficient funds to place distribution center' });
      return;
    }

    // Deduct money first (only if cost is greater than 0)
    let moneyDeducted = true;
    if (distributionCenterCost > 0) {
      moneyDeducted = await dbOperations.deductUserGameMoney(
        userId,
        gameId,
        distributionCenterCost
      );
      if (!moneyDeducted) {
        res.status(400).json({ error: 'Failed to deduct money - insufficient funds' });
        return;
      }
    }

    let distributionCenter;
    try {
      distributionCenter = await dbOperations.placeFranchise(
        userId,
        gameId,
        lat,
        long,
        name,
        county,
        state,
        metroArea,
        'distributionCenter'
      );
    } catch (error) {
      console.error('❌ Error in placeFranchise:', error);
      // If placement failed, refund the money (only if money was deducted)
      if (distributionCenterCost > 0) {
        const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
        await dbOperations.updateUserGameMoney(
          userId,
          gameId,
          currentMoney + distributionCenterCost
        );
      }
      res.status(500).json({ error: 'Database error: ' + (error as Error).message });
      return;
    }

    if (!distributionCenter) {
      // If placement failed, refund the money (only if money was deducted)
      if (distributionCenterCost > 0) {
        const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
        await dbOperations.updateUserGameMoney(
          userId,
          gameId,
          currentMoney + distributionCenterCost
        );
      }
      res.status(500).json({ error: 'Failed to place distribution center' });
      return;
    }

    // Get the updated money amount after placement
    const remainingMoney = await dbOperations.getUserGameMoney(userId, gameId);

    io.of('/game').to(`game-${gameId}`).emit('location-added', distributionCenter);

    // Emit money update to the specific user via socket
    const userSockets = Array.from(io.sockets.sockets.values()).filter(
      socket => socket.userId === userId && socket.gameId === gameId
    );

    userSockets.forEach(socket => {
      socket.emit('money-update', { userId, newMoney: remainingMoney });
      console.log(`Emitted money update to user ${userId}: $${remainingMoney}`);
    });

    res.json({
      message: isFirstDistributionCenter
        ? 'First distribution center placed successfully (FREE!)'
        : 'Distribution center placed successfully',
      cost: distributionCenterCost,
      remainingMoney,
    });
  } catch (error) {
    console.error('Error placing distribution center:', error);
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
