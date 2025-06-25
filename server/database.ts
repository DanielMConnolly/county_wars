import { PrismaClient } from '@prisma/client';
import { User, Game, UserGameMoney, PlacedFranchise } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize database connection
export const initDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database using Prisma');
  } catch (error) {
    console.error('Failed to connect to database:', error);
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
  createGame: async (gameId: string, name: string, createdBy: string): Promise<boolean> => {
    try {
      await prisma.game.create({
        data: {
          id: gameId,
          name,
          createdBy,
          isActive: true,
          elapsedTime: 0,
        },
      });
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
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

  deleteGame: async (gameId: string): Promise<boolean> => {
    try {
      // Delete related records first
      await prisma.placedFranchise.deleteMany({
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

  getGameElapsedTime: async (gameId: string): Promise<number> => {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { elapsedTime: true },
      });
      return game?.elapsedTime || 0;
    } catch (error) {
      console.error('Error getting game elapsed time:', error);
      return 0;
    }
  },

  updateGameElapsedTime: async (gameId: string, elapsedTime: number): Promise<boolean> => {
    try {
      await prisma.game.update({
        where: { id: gameId },
        data: { elapsedTime },
      });
      return true;
    } catch (error) {
      console.error('Error updating game elapsed time:', error);
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

  // Franchise operations
  placeFranchise: async (userId: string, gameId: string, lat: number, long: number, name: string): Promise<boolean> => {
    try {
      await prisma.placedFranchise.create({
        data: {
          userId,
          gameId,
          lat,
          long,
          name,
        },
      });
      return true;
    } catch (error) {
      console.error('Error placing franchise:', error);
      return false;
    }
  },

  getUserFranchises: async (userId: string, gameId: string): Promise<PlacedFranchise[]> => {
    try {
      const franchises = await prisma.placedFranchise.findMany({
        where: {
          userId,
          gameId,
        },
        orderBy: { timePlaced: 'desc' },
      });
      return franchises;
    } catch (error) {
      console.error('Error getting user franchises:', error);
      return [];
    }
  },

  getGameFranchises: async (gameId: string): Promise<PlacedFranchise[]> => {
    try {
      const franchises = await prisma.placedFranchise.findMany({
        where: { gameId },
        orderBy: { timePlaced: 'desc' },
      });
      return franchises;
    } catch (error) {
      console.error('Error getting game franchises:', error);
      return [];
    }
  },

  removeFranchise: async (franchiseId: number, userId: string): Promise<boolean> => {
    try {
      const result = await prisma.placedFranchise.deleteMany({
        where: {
          id: franchiseId,
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

  createUserWithAuth: async (userId: string, username: string, email: string, passwordHash: string): Promise<User | null> => {
    try {
      const user = await prisma.user.create({
        data: {
          id: userId,
          username,
          email,
          passwordHash,
          highlightColor: 'red',
          money: 1000,
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating user with auth:', error);
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

  // Stats operations
  getStats: async (): Promise<any> => {
    try {
      const [userCount, gameCount, franchiseCount] = await Promise.all([
        prisma.user.count(),
        prisma.game.count(),
        prisma.placedFranchise.count(),
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

// Initialize database on import
initDatabase().catch(console.error);

// Graceful shutdown
process.on('beforeExit', () => {
  closeDatabase();
});