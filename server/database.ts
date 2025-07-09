import { PrismaClient } from '@prisma/client';
import { User, Game } from '@prisma/client';
import { Franchise, GamePlayer, GameUpdate } from '../src/types/GameTypes';

const prisma = new PrismaClient();

// Initialize database connection
export const initDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database using Prisma');

    // Test database connection with a simple query
    const userCount = await prisma.user.count();
    console.log(`Database connection verified. User count: ${userCount}`);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  await prisma.$disconnect();
};

export const dbOperations = {
  // User operations
  createUser: async (userId: string): Promise<User> => {
    try {
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: { lastActive: new Date() },
        create: {
          id: userId,
          highlightColor: 'red',
          money: 1000,
          lastActive: new Date(),
          createdAt: new Date(),
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  getUserHighlightColor: async (userId: string): Promise<string> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { highlightColor: true },
      });
      return user?.highlightColor || 'red';
    } catch (error) {
      console.error('Error getting user highlight color:', error);
      return 'red';
    }
  },

  updateUserHighlightColor: async (userId: string, color: string): Promise<boolean> => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { highlightColor: color },
      });
      return true;
    } catch (error) {
      console.error('Error updating user highlight color:', error);
      return false;
    }
  },

  // Game operations
  createGame: async (gameId: string, createdBy: string): Promise<boolean> => {
    try {
      await prisma.game.create({
        data: {
          id: gameId,
          createdBy,
          isActive: true,
          turnNumber: 1,
          playerWhosTurnItIs: createdBy,
        },
      });
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  },

  updateGame: async (gameId: string, updates: GameUpdate): Promise<boolean> => {
    try {
      const updateData: GameUpdate = {};

      // Add fields if provided
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.numberOfTurns !== undefined) {
        updateData.numberOfTurns = updates.numberOfTurns;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      await prisma.game.update({
        where: { id: gameId },
        data: updateData,
      });
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  },

  getAllGames: async (): Promise<Game[]> => {
    try {
      const games = await prisma.game.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return games;
    } catch (error) {
      console.error('Error getting all games:', error);
      return [];
    }
  },

  getDraftGames: async (): Promise<Game[]> => {
    try {
      const games = await prisma.game.findMany({
        where: { status: 'DRAFT' },
        orderBy: { createdAt: 'desc' },
      });
      return games;
    } catch (error) {
      console.error('Error getting draft games:', error);
      return [];
    }
  },

  getGame: async (gameId: string): Promise<Game | null> => {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });
      return game;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  getUserGames: async (userId: string): Promise<Game[]> => {
    try {
      const games = await prisma.game.findMany({
        where: {
          OR: [
            { createdBy: userId },
            { userGameMoney: { some: { userId } } },
            { gameUsers: { some: { userId } } }, // Also include games from GameUser table
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return games;
    } catch (error) {
      console.error('Error getting user games:', error);
      return [];
    }
  },

  getUserLiveGames: async (userId: string): Promise<Game[]> => {
    try {
      const games = await prisma.game.findMany({
        where: {
          status: 'LIVE',
          OR: [
            { createdBy: userId },
            { userGameMoney: { some: { userId } } },
            { gameUsers: { some: { userId } } }, // Also include games from GameUser table
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return games;
    } catch (error) {
      console.error('Error getting user live games:', error);
      return [];
    }
  },

  deleteGame: async (gameId: string): Promise<boolean> => {
    try {
      // Delete related records first
      await prisma.placedLocation.deleteMany({
        where: { gameId },
      });
      await prisma.userGameMoney.deleteMany({
        where: { gameId },
      });
      await prisma.game.delete({
        where: { id: gameId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  },

  getGameTurnInfo: async (
    gameId: string
  ): Promise<{ turnNumber: number; playerWhosTurnItIs: string | null }> => {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { turnNumber: true, playerWhosTurnItIs: true },
      });
      return {
        turnNumber: game?.turnNumber || 1,
        playerWhosTurnItIs: game?.playerWhosTurnItIs || null,
      };
    } catch (error) {
      console.error('Error getting game turn info:', error);
      return { turnNumber: 1, playerWhosTurnItIs: null };
    }
  },

  getGameNumberOfTurns: async (gameId: string): Promise<number | null> => {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { numberOfTurns: true },
      });
      return game?.numberOfTurns || null;
    } catch (error) {
      console.error('Error getting game number of turns:', error);
      return null;
    }
  },

  updateGameTurnInfo: async (
    gameId: string,
    turnNumber: number,
    playerWhosTurnItIs: string | null
  ): Promise<boolean> => {
    try {
      await prisma.game.update({
        where: { id: gameId },
        data: { turnNumber, playerWhosTurnItIs },
      });
      return true;
    } catch (error) {
      console.error('Error updating game turn info:', error);
      return false;
    }
  },

  advanceGameTurn: async (gameId: string, nextPlayerId: string): Promise<boolean> => {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { turnNumber: true },
      });

      if (!game) return false;

      await prisma.game.update({
        where: { id: gameId },
        data: {
          turnNumber: game.turnNumber + 1,
          playerWhosTurnItIs: nextPlayerId,
        },
      });
      return true;
    } catch (error) {
      console.error('Error advancing game turn:', error);
      return false;
    }
  },

  // User game money operations
  getUserGameMoney: async (userId: string, gameId: string): Promise<number> => {
    try {
      const userGameMoney = await prisma.userGameMoney.findUnique({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        select: { money: true },
      });
      return userGameMoney?.money || 1000;
    } catch (error) {
      console.error('Error getting user game money:', error);
      return 1000;
    }
  },

  updateUserGameMoney: async (userId: string, gameId: string, amount: number): Promise<boolean> => {
    try {
      await prisma.userGameMoney.upsert({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        update: {
          money: amount,
          updatedAt: new Date(),
        },
        create: {
          userId,
          gameId,
          money: amount,
        },
      });
      return true;
    } catch (error) {
      console.error('Error updating user game money:', error);
      return false;
    }
  },

  deductUserGameMoney: async (userId: string, gameId: string, amount: number): Promise<boolean> => {
    try {
      const current = await dbOperations.getUserGameMoney(userId, gameId);
      if (current < amount) {
        return false;
      }
      const newAmount = current - amount;
      return await dbOperations.updateUserGameMoney(userId, gameId, newAmount);
    } catch (error) {
      console.error('Error deducting user game money:', error);
      return false;
    }
  },

  // Income operations
  createIncomeAtTurn: async (
    userId: string,
    gameId: string,
    turn: number,
    incomeAmount: number
  ): Promise<boolean> => {
    try {
      await prisma.incomeAtTurn.create({
        data: {
          userId,
          gameId,
          turn,
          incomeAmount
        }
      });
      return true;
    } catch (error) {
      console.error('Error creating income at turn:', error);
      return false;
    }
  },

  // Franchise operations
  placeFranchise: async (
    userId: string,
    gameId: string,
    lat: number,
    long: number,
    name: string,
    county?: string,
    state?: string,
    metroArea?: string | null,
    locationType: 'franchise' | 'distributionCenter' = 'franchise',
    population?: number
  ): Promise<Franchise | null> => {
    try {
      const userData = await dbOperations.getUserById(userId);
      const result = await prisma.placedLocation.create({
        data: {
          userId,
          gameId,
          lat,
          long,
          name,
          locationType: locationType,
          county,
          state,
          metroArea,
          population,
        },
      });
      return {
        ...result,
        username: userData?.username ?? 'Unknown',
        population: result.population ?? 100,
        id: result.id.toString(),
        locationType:
          result.locationType === 'distributionCenter' ? 'distribution-center' : 'franchise',
      };
    } catch (error) {
      console.error('❌ Database error in placeFranchise:', error);
      throw error; // Re-throw the error so the server can handle it
    }
  },

  getGameFranchises: async (gameId: string): Promise<any[]> => {
    try {
      const franchises = await prisma.placedLocation.findMany({
        where: { gameId },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      // Transform to match client-side Franchise type
      return franchises.map(franchise => ({
        id: franchise.id.toString(),
        lat: franchise.lat,
        long: franchise.long,
        name: franchise.name,
        userId: franchise.userId,
        username: franchise.user.username || 'Unknown',
        county: franchise.county,
        state: franchise.state,
        metroArea: franchise.metroArea,
        population: franchise.population,
        locationType:
          franchise.locationType === 'distributionCenter' ? 'distribution-center' : 'franchise',
      }));
    } catch (error) {
      console.error('Error getting game franchises:', error);
      return [];
    }
  },

  getUserGameFranchises: async (userId: string, gameId: string): Promise<Franchise[]> => {
    try {
      const franchises = await prisma.placedLocation.findMany({
        where: {
          gameId,
          userId,
          locationType: 'franchise',
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      // Transform to match client-side Franchise type
      return franchises.map(franchise => ({
        id: franchise.id.toString(),
        lat: franchise.lat,
        long: franchise.long,
        name: franchise.name,
        population: franchise.population ?? 100,
        userId: franchise.userId,
        username: franchise.user.username || 'Unknown',
        county: franchise.county,
        state: franchise.state,
        metroArea: franchise.metroArea,
        locationType:
          franchise.locationType === 'distributionCenter' ? 'distribution-center' : 'franchise',
      }));
    } catch (error) {
      console.error('Error getting user game franchises:', error);
      return [];
    }
  },

  // Update existing franchises with location data
  updateFranchiseLocation: async (
    franchiseId: number,
    county?: string,
    state?: string,
    metroArea?: string
  ): Promise<boolean> => {
    try {
      await prisma.placedLocation.update({
        where: { id: franchiseId },
        data: {
          county,
          state,
          metroArea,
        },
      });
      return true;
    } catch (error) {
      console.error('Error updating franchise location:', error);
      return false;
    }
  },

  removeFranchise: async (franchiseId: string, userId: string): Promise<boolean> => {
    try {
      const franchiseIdNum = parseInt(franchiseId, 10);
      if (isNaN(franchiseIdNum)) {
        console.error('Invalid franchise ID:', franchiseId);
        return false;
      }

      const result = await prisma.placedLocation.deleteMany({
        where: {
          id: franchiseIdNum,
          userId,
        },
      });
      return result.count > 0;
    } catch (error) {
      console.error('Error removing franchise:', error);
      return false;
    }
  },

  // Auth operations
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  createUserWithAuth: async (
    userId: string,
    username: string,
    email: string,
    passwordHash: string
  ): Promise<User | null> => {
    try {
      console.log(
        `Creating user with auth: userId=${userId}, username=${username}, email=${email}`
      );
      const user = await prisma.user.create({
        data: {
          id: userId,
          username,
          email,
          passwordHash,
          highlightColor: 'red',
          money: 1000,
          createdAt: new Date(),
          lastActive: new Date(),
        },
      });
      console.log(`Successfully created user: ${user.id}`);
      return user;
    } catch (error: any) {
      console.error('Error creating user with auth:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
      });
      return null;
    }
  },

  updateUserActivity: async (userId: string): Promise<boolean> => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() },
      });
      return true;
    } catch (error) {
      console.error('Error updating user activity:', error);
      return false;
    }
  },

  // GameUser operations
  addUserToGame: async (userId: string, gameId: string): Promise<boolean> => {
    try {
      await prisma.gameUser.upsert({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        update: {
          // No updates needed, just ensure the record exists
        },
        create: {
          userId,
          gameId,
          joinedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error adding user to game:', error);
      return false;
    }
  },

  addUsersToGame: async (userIds: string[], gameId: string): Promise<boolean> => {
    try {
      // Use a transaction to ensure all users are added atomically
      await prisma.$transaction(
        userIds.map(userId =>
          prisma.gameUser.upsert({
            where: {
              userId_gameId: {
                userId,
                gameId,
              },
            },
            update: {
              // No updates needed, just ensure the record exists
            },
            create: {
              userId,
              gameId,
              joinedAt: new Date(),
            },
          })
        )
      );
      return true;
    } catch (error) {
      console.error('Error adding users to game:', error);
      return false;
    }
  },

  // Get all players in a game with their money
  getGamePlayersWithMoney: async (gameId: string): Promise<GamePlayer[]> => {
    try {
      const gameUsers = await prisma.gameUser.findMany({
        where: { gameId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              highlightColor: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      const playersWithMoney = await Promise.all(
        gameUsers.map(async gameUser => {
          const money = await dbOperations.getUserGameMoney(gameUser.userId, gameId);
          return {
            userId: gameUser.user.id,
            username: gameUser.user.username || gameUser.user.id,
            money: money,
          };
        })
      );

      // Sort by money descending for standings
      return playersWithMoney.sort((a, b) => b.money - a.money);
    } catch (error) {
      console.error('Error getting game players with money:', error);
      return [];
    }
  },

  // Stats operations
  getStats: async (): Promise<any> => {
    try {
      const [userCount, gameCount, franchiseCount] = await Promise.all([
        prisma.user.count(),
        prisma.game.count(),
        prisma.placedLocation.count(),
      ]);

      return {
        users: userCount,
        games: gameCount,
        franchises: franchiseCount,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        users: 0,
        games: 0,
        franchises: 0,
      };
    }
  },
};

// Note: Database initialization should be called explicitly from server.ts

// Graceful shutdown
process.on('beforeExit', () => {
  closeDatabase();
});
