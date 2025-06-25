import Database from 'better-sqlite3';
import path from 'path';
import { Franchise, GameTime } from '../src/types/GameTypes';
import { User } from './types/ServerTypes';

// Initialize SQLite database
const dbPath = process.env.TEST_DATABASE_PATH || path.join(process.cwd(), 'county-wars.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
const initDatabase = () => {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      highlight_color TEXT DEFAULT 'red'
    )
  `);

  // Create games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      elapsed_time INTEGER DEFAULT 0,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Create user_game_money table for per-game money tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_game_money (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      money INTEGER DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (game_id) REFERENCES games (id),
      UNIQUE(user_id, game_id)
    )
  `);

  // Create placed_franchises table
  db.exec(`
    CREATE TABLE IF NOT EXISTS placed_franchises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      lat REAL NOT NULL,
      long REAL NOT NULL,
      name TEXT NOT NULL,
      time_placed DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (game_id) REFERENCES games (id)
    )
  `);

  // Create indexes for better performance (will be created after migrations)
  // Moved to after migrations to ensure columns exist

  // Migration: Add highlight_color column if it doesn't exist
  try {
    // Check if the column exists by trying to select from it
    db.prepare('SELECT highlight_color FROM users LIMIT 1').get();
  } catch (_) {
    // Column doesn't exist, add it
    console.log('Adding highlight_color column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN highlight_color TEXT DEFAULT 'red'`);
    console.log('highlight_color column added successfully');
  }

  // Migration: Add game_time column if it doesn't exist
  try {
    // Check if the column exists by trying to select from it
    db.prepare('SELECT game_time FROM users LIMIT 1').get();
  } catch (_) {
    // Column doesn't exist, add it
    console.log('Adding game_time column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN game_time TEXT`);
    console.log('game_time column added successfully');
  }

  // Migration: Add authentication columns if they don't exist
  try {
    db.prepare('SELECT username FROM users LIMIT 1').get();
  } catch (_) {
    console.log('Adding authentication columns to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
    console.log('Authentication columns added successfully');
  }

  // Migration: Add money column if it doesn't exist
  try {
    db.prepare('SELECT money FROM users LIMIT 1').get();
  } catch (_) {
    console.log('Adding money column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN money INTEGER DEFAULT 1000`);
    console.log('Money column added successfully');
  }

  // Migration: Add elapsed_time column to games if it doesn't exist
  try {
    db.prepare('SELECT elapsed_time FROM games LIMIT 1').get();
  } catch (_) {
    console.log('Adding elapsed_time column to games table...');
    db.exec(`ALTER TABLE games ADD COLUMN elapsed_time INTEGER DEFAULT 0`);
    console.log('elapsed_time column added successfully');
  }

  // Create indexes for better performance (after migrations)
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
      CREATE INDEX IF NOT EXISTS idx_placed_franchises_user_id ON placed_franchises(user_id);
      CREATE INDEX IF NOT EXISTS idx_placed_franchises_game_id ON placed_franchises(game_id);
      CREATE INDEX IF NOT EXISTS idx_user_game_money_user_id ON user_game_money(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_game_money_game_id ON user_game_money(game_id);
    `);
    console.log('Database indexes created successfully');
  } catch (error) {
    console.log('Note: Some indexes may already exist or failed to create:', error);
  }

  // Create unique indexes for authentication columns
  try {
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL`);
  } catch (_) {
    console.log('Note: Unique indexes for auth columns may already exist or have conflicts');
  }

  // Initialize prepared statements after tables are created
  statements = {
    insertUser: db.prepare('INSERT OR IGNORE INTO users (id, money) VALUES (?, 1000)'),
    createUser:
     db.prepare('INSERT INTO users (id, username, email, password_hash, money) VALUES (?, ?, ?, ?, 1000)'),
    updateUserActivity: db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?'),

    // Game operations
    createGame: db.prepare('INSERT INTO games (id, name, created_by) VALUES (?, ?, ?)'),
    getGame: db.prepare('SELECT * FROM games WHERE id = ?'),
    getAllGames: db.prepare('SELECT * FROM games ORDER BY created_at DESC'),
    getUserGames: db.prepare('SELECT * FROM games WHERE created_by = ? ORDER BY created_at DESC'),
    updateGameElapsedTime: db.prepare('UPDATE games SET elapsed_time = ? WHERE id = ?'),
    getGameElapsedTime: db.prepare('SELECT elapsed_time FROM games WHERE id = ?'),
    deleteGame: db.prepare('DELETE FROM games WHERE id = ?'),

    // Franchise operations
    placeFranchise:
     db.prepare('INSERT INTO placed_franchises (user_id, game_id, lat, long, name) VALUES (?, ?, ?, ?, ?)'),
    getUserFranchises: db.prepare('SELECT * FROM placed_franchises WHERE user_id = ? AND game_id = ?'),
    getGameFranchises: db.prepare(`
      SELECT pf.*, u.username
      FROM placed_franchises pf
      JOIN users u ON pf.user_id = u.id
      WHERE pf.game_id = ?
    `),
    removeFranchise: db.prepare('DELETE FROM placed_franchises WHERE id = ? AND user_id = ?'),

    // User operations
    updateUserHighlightColor:
      db.prepare('UPDATE users SET highlight_color = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserHighlightColor: db.prepare('SELECT highlight_color FROM users WHERE id = ?'),
    updateUserGameTime:
      db.prepare('UPDATE users SET game_time = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),

    // User-game money operations
    getUserGameMoney: db.prepare('SELECT money FROM user_game_money WHERE user_id = ? AND game_id = ?'),
    insertUserGameMoney: db.prepare('INSERT OR IGNORE INTO user_game_money (user_id, game_id, money) VALUES (?, ?, ?)'),
    updateUserGameMoney: db.prepare('UPDATE user_game_money SET money = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?'),
    deductUserGameMoney: db.prepare(
      'UPDATE user_game_money SET money = money - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ? AND money >= ?')
  };

  console.log('Database initialized successfully');
};

// Prepared statements - will be initialized after tables are created
let statements: any = {};

// Database operations
export const dbOperations = {
  init: initDatabase,
  createUser: (userId: string) => {
    statements.insertUser.run(userId);
    statements.updateUserActivity.run(userId);
  },
  createUserWithAuth: (userId: string, username: string, email: string, passwordHash: string) => {
    try {
      statements.createUser.run(userId, username, email, passwordHash);
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  },
  updateUserActivity: (userId: string) => {
    statements.updateUserActivity.run(userId);
  },

  // Game operations
  createGame: (gameId: string, gameName: string, createdBy: string): boolean => {
    try {
      statements.createGame.run(gameId, gameName, createdBy);
      return true;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  },

  getGame: (gameId: string): any => {
    try {
      return statements.getGame.get(gameId);
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  },

  getUserGames: (userId: string): any[] => {
    try {
      return statements.getUserGames.all(userId) as any[];
    } catch (error) {
      console.error('Error getting user games:', error);
      return [];
    }
  },

  // Database maintenance
  close: () => {
    db.close();
  },

  // Get database stats
  getStats: () => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

      return {
        users: userCount.count,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { users: 0, claimedCounties: 0 };
    }
  },

  // Highlight color operations
  updateUserHighlightColor: (userId: string, color: string): boolean => {
    try {
      const result = statements.updateUserHighlightColor.run(color, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user highlight color:', error);
      return false;
    }
  },

  getUserHighlightColor: (userId: string): string => {
    try {
      const result = statements.getUserHighlightColor.get(userId) as { highlight_color: string } | undefined;
      return result?.highlight_color || 'red';
    } catch (error) {
      console.error('Error getting user highlight color:', error);
      return 'red';
    }
  },

  getGameTime: (userId: string): GameTime | null => {
    try {
      const result = statements.getUserGameTime.get(userId) as { game_time: string } | undefined;
      if (result?.game_time) {
        return JSON.parse(result.game_time);
      }
      return null;
    } catch (error) {
      console.error('Error getting user game time:', error);
      return null;
    }
  },

  // Authentication operations
  getUserByUsername: (username: string): User | null => {
    try {
      return statements.getUserByUsername.get(username);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  },

  getUserByEmail: (email: string): User | null => {
    try {
      return statements.getUserByEmail.get(email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  getUserById: (id: string): any => {
    try {
      return statements.getUserById.get(id);
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  },

  // Money operations - now per game
  getUserGameMoney: (userId: string, gameId: string): number => {
    try {
      // First, ensure the user-game money record exists
      statements.insertUserGameMoney.run(userId, gameId, 1000);

      const result = statements.getUserGameMoney.get(userId, gameId) as { money: number } | undefined;
      return result?.money || 1000; // Default to starting money if not found
    } catch (error) {
      console.error('Error getting user game money:', error);
      return 1000;
    }
  },

  updateUserGameMoney: (userId: string, gameId: string, amount: number): boolean => {
    try {
      // Ensure the record exists first
      statements.insertUserGameMoney.run(userId, gameId, 1000);

      const result = statements.updateUserGameMoney.run(amount, userId, gameId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user game money:', error);
      return false;
    }
  },

  getAllGames: (): any[] => {
    try{
      const result = statements.getAllGames.all();
      return result;
    }
    catch (error) {
      console.error('Error getting user money:', error);
      return [];
    }
  },

  deductUserGameMoney: (userId: string, gameId: string, cost: number): boolean => {
    try {
      // Ensure the record exists first
      statements.insertUserGameMoney.run(userId, gameId, 1000);

      // This will only deduct if user has enough money (money >= cost)
      const result = statements.deductUserGameMoney.run(cost, userId, gameId, cost);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deducting user game money:', error);
      return false;
    }
  },

  // Legacy method for backward compatibility
  deductUserMoney: (userId: string, cost: number): boolean => {
    return dbOperations.deductUserGameMoney(userId, 'default-game', cost);
  },

  // Game elapsed time operations
  updateGameElapsedTime: (gameId: string, elapsedTime: number): boolean => {
    try {
      const result = statements.updateGameElapsedTime.run(elapsedTime, gameId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating game elapsed time:', error);
      return false;
    }
  },

  getGameElapsedTime: (gameId: string): number => {
    try {
      const result = statements.getGameElapsedTime.get(gameId) as { elapsed_time: number } | undefined;
      return result?.elapsed_time || 0;
    } catch (error) {
      console.error('Error getting game elapsed time:', error);
      return 0;
    }
  },

  // Franchise operations
  placeFranchise: (userId: string, gameId: string, lat: number, long: number, name: string): boolean => {
    try {
      const result = statements.placeFranchise.run(userId, gameId, lat, long, name);
      return result.changes > 0;
    } catch (error) {
      console.error('Error placing franchise:', error);
      return false;
    }
  },

  getUserFranchises: (userId: string, gameId: string): any[] => {
    try {
      return statements.getUserFranchises.all(userId, gameId) as any[];
    } catch (error) {
      console.error('Error getting user franchises:', error);
      return [];
    }
  },

  getGameFranchises: (gameId: string): Franchise[] => {
    try {
      console.log('Getting game franchises for game:', gameId);
      console.log(statements.getGameFranchises.all(gameId) );
      return statements.getGameFranchises.all(gameId);
    } catch (error) {
      console.error('Error getting game franchises:', error);
      return [];
    }
  },

  removeFranchise: (franchiseId: number, userId: string): boolean => {
    try {
      const result = statements.removeFranchise.run(franchiseId, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error removing franchise:', error);
      return false;
    }
  },

  // Delete game and all related data
  deleteGame: (gameId: string): boolean => {
    try {
      // Delete related data first (due to foreign key constraints)
      db.prepare('DELETE FROM user_counties WHERE game_id = ?').run(gameId);
      db.prepare('DELETE FROM placed_franchises WHERE game_id = ?').run(gameId);
      db.prepare('DELETE FROM user_game_money WHERE game_id = ?').run(gameId);

      // Then delete the game
      const result = statements.deleteGame.run(gameId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }
};

// Initialize database on module load
initDatabase();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connection...');
  db.close();
  process.exit(0);
});
