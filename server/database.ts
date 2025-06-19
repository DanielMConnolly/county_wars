import Database from 'better-sqlite3';
import path from 'path';
import { GameTime } from '../src/types/GameTypes';
import { User } from './types/ServerTypes';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'county-wars.db');
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

  // Create user_counties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_counties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      county_name TEXT NOT NULL,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, county_name)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_counties_user_id ON user_counties(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_counties_county_name ON user_counties(county_name);
  `);

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
    insertUser: db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)'),
    createUser: db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)'),
    updateUserActivity: db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserCounties: db.prepare('SELECT county_name FROM user_counties WHERE user_id = ?'),
    claimCounty: db.prepare('INSERT OR IGNORE INTO user_counties (user_id, county_name) VALUES (?, ?)'),
    releaseCounty: db.prepare('DELETE FROM user_counties WHERE user_id = ? AND county_name = ?'),
    isCountyOwned: db.prepare('SELECT user_id FROM user_counties WHERE county_name = ?'),
    getAllTakenCounties: db.prepare('SELECT county_name, user_id FROM user_counties'),
    getCountyOwner: db.prepare('SELECT user_id FROM user_counties WHERE county_name = ?'),
    updateUserHighlightColor:
      db.prepare('UPDATE users SET highlight_color = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserHighlightColor: db.prepare('SELECT highlight_color FROM users WHERE id = ?'),
    updateUserGameTime:
      db.prepare('UPDATE users SET game_time = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'),
    getUserGameTime: db.prepare('SELECT game_time FROM users WHERE id = ?'),
    getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?')
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
  getUserCounties: (userId: string): string[] => {
    const rows = statements.getUserCounties.all(userId) as { county_name: string }[];
    return rows.map(row => row.county_name);
  },
  claimCounty: (userId: string, countyName: string): boolean => {
    try {
      // Check if county is already owned by someone else
      const existingOwner = statements.isCountyOwned.get(countyName) as { user_id: string } | undefined;
      if (existingOwner && existingOwner.user_id !== userId) {
        return false; // County already owned by another user
      }

      // Claim the county
      const result = statements.claimCounty.run(userId, countyName);
      statements.updateUserActivity.run(userId);

      return result.changes > 0;
    } catch (error) {
      console.error('Error claiming county:', error);
      return false;
    }
  },
  releaseCounty: (userId: string, countyName: string): boolean => {
    try {
      const result = statements.releaseCounty.run(userId, countyName);
      statements.updateUserActivity.run(userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error releasing county:', error);
      return false;
    }
  },
  isCountyOwned: (countyName: string): { owned: boolean, owner?: string } => {
    try {
      const owner = statements.getCountyOwner.get(countyName) as { user_id: string } | undefined;
      return owner ? { owned: true, owner: owner.user_id } : { owned: false };
    } catch (error) {
      console.error('Error checking county ownership:', error);
      return { owned: false };
    }
  },
  getAllTakenCounties: (): Record<string, string> => {
    try {
      const rows = statements.getAllTakenCounties.all() as { county_name: string, user_id: string }[];
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
