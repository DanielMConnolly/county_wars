import Database from 'better-sqlite3';
import path from 'path';
import { GameTime } from '../src/types/GameTypes';
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
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Create user_counties table (now game-specific)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_counties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      county_name TEXT NOT NULL,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (game_id) REFERENCES games (id),
      UNIQUE(user_id, game_id, county_name)
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

  // Migration: Add game_id column to user_counties if it doesn't exist
  try {
    db.prepare('SELECT game_id FROM user_counties LIMIT 1').get();
  } catch (_) {
    console.log('Adding game_id column to user_counties table...');
    db.exec(`ALTER TABLE user_counties ADD COLUMN game_id TEXT DEFAULT 'default-game'`);
    console.log('Game_id column added successfully');
  }

  // Create indexes for better performance (after migrations)
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_counties_user_id ON user_counties(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_counties_game_id ON user_counties(game_id);
      CREATE INDEX IF NOT EXISTS idx_user_counties_county_name ON user_counties(county_name);
      CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
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

    // County operations (now game-specific)
    getUserCounties: db.prepare('SELECT county_name FROM user_counties WHERE user_id = ? AND game_id = ?'),
    claimCounty:
     db.prepare('INSERT OR IGNORE INTO user_counties (user_id, game_id, county_name) VALUES (?, ?, ?)'),
    releaseCounty:
     db.prepare('DELETE FROM user_counties WHERE user_id = ? AND game_id = ? AND county_name = ?'),
    isCountyOwned: db.prepare('SELECT user_id FROM user_counties WHERE game_id = ? AND county_name = ?'),
    getAllTakenCounties: db.prepare('SELECT county_name, user_id FROM user_counties WHERE game_id = ?'),
    getCountyOwner: db.prepare('SELECT user_id FROM user_counties WHERE game_id = ? AND county_name = ?'),

    // User operations
    updateUserHighlightColor:
      db.prepare('UPDATE users SET highlight_color = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserHighlightColor: db.prepare('SELECT highlight_color FROM users WHERE id = ?'),
    updateUserGameTime:
      db.prepare('UPDATE users SET game_time = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserGameTime: db.prepare('SELECT game_time FROM users WHERE id = ?'),
    getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    getUserMoney: db.prepare('SELECT money FROM users WHERE id = ?'),
    updateUserMoney: db.prepare('UPDATE users SET money = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    deductUserMoney: db.prepare(
      'UPDATE users SET money = money - ?, last_active = CURRENT_TIMESTAMP WHERE id = ? AND money >= ?')
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

  // County operations (now game-specific)
  getUserCounties: (userId: string, gameId: string): string[] => {
    const rows = statements.getUserCounties.all(userId, gameId) as { county_name: string }[];
    return rows.map(row => row.county_name);
  },


  claimCounty: (userId: string, gameId: string, countyName: string): boolean => {
    try {
      // Check if county is already owned by someone else in this game
      const existingOwner =
       statements.isCountyOwned.get(gameId, countyName) as { user_id: string } | undefined;
      if (existingOwner && existingOwner.user_id !== userId) {
        return false; // County already owned by another user
      }

      // Claim the county
      const result = statements.claimCounty.run(userId, gameId, countyName);
      statements.updateUserActivity.run(userId);

      return result.changes > 0;
    } catch (error) {
      console.error('Error claiming county:', error);
      return false;
    }
  },

  releaseCounty: (userId: string, gameId: string, countyName: string): boolean => {
    try {
      const result = statements.releaseCounty.run(userId, gameId, countyName);
      statements.updateUserActivity.run(userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error releasing county:', error);
      return false;
    }
  },

  isCountyOwned: (gameId: string, countyName: string): { owned: boolean, owner?: string } => {
    try {
      const owner = statements.getCountyOwner.get(gameId, countyName) as { user_id: string } | undefined;
      return owner ? { owned: true, owner: owner.user_id } : { owned: false };
    } catch (error) {
      console.error('Error checking county ownership:', error);
      return { owned: false };
    }
  },

  getAllTakenCounties: (gameId: string): Record<string, string> => {
    try {
      const rows = statements.getAllTakenCounties.all(gameId) as { county_name: string, user_id: string }[];
      const result: Record<string, string> = {};

      for (const row of rows) {
        result[row.county_name] = row.user_id;
      }

      return result;
    } catch (error) {
      console.error('Error getting all taken counties:', error);
      return {};
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
      const countyCount =
        db.prepare('SELECT COUNT(*) as count FROM user_counties').get() as { count: number };

      return {
        users: userCount.count,
        claimedCounties: countyCount.count
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

  // Game time operations
  updateUserGameTime: (userId: string, gameTime: GameTime): boolean => {
    try {
      const gameTimeJson = JSON.stringify(gameTime);
      const result = statements.updateUserGameTime.run(gameTimeJson, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user game time:', error);
      return false;
    }
  },

  getUserGameTime: (userId: string): GameTime | null => {
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

  // Money operations
  getUserMoney: (userId: string): number => {
    try {
      const result = statements.getUserMoney.get(userId) as { money: number } | undefined;
      return result?.money || 1000; // Default to starting money if not found
    } catch (error) {
      console.error('Error getting user money:', error);
      return 1000;
    }
  },



  updateUserMoney: (userId: string, amount: number): boolean => {
    try {
      const result = statements.updateUserMoney.run(amount, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user money:', error);
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

  deductUserMoney: (userId: string, cost: number): boolean => {
    try {
      // This will only deduct if user has enough money (money >= cost)
      const result = statements.deductUserMoney.run(cost, userId, cost);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deducting user money:', error);
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
