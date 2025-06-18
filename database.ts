import Database from 'better-sqlite3';
import path from 'path';

// SQL template tag for syntax highlighting
const sql = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((result, string, i) => result + string + (values[i] || ''), '');

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'county-wars.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
const initDatabase = () => {
  // Create users table
  db.exec(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_counties table
  db.exec(sql`
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
  db.exec(sql`
    CREATE INDEX IF NOT EXISTS idx_user_counties_user_id ON user_counties(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_counties_county_name ON user_counties(county_name);
  `);

  console.log('Database initialized successfully');
};

// Prepared statements for better performance
const statements = {
  insertUser: db.prepare(sql`INSERT OR IGNORE INTO users (id) VALUES (?)`),
  updateUserActivity: db.prepare(sql`UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`),
  getUserCounties: db.prepare(sql`SELECT county_name FROM user_counties WHERE user_id = ?`),
  claimCounty: db.prepare(sql`INSERT OR IGNORE INTO user_counties (user_id, county_name) VALUES (?, ?)`),
  releaseCounty: db.prepare(sql`DELETE FROM user_counties WHERE user_id = ? AND county_name = ?`),
  isCountyOwned: db.prepare(sql`SELECT user_id FROM user_counties WHERE county_name = ?`),
  getAllTakenCounties: db.prepare(sql`SELECT county_name, user_id FROM user_counties`),
  getCountyOwner: db.prepare(sql`SELECT user_id FROM user_counties WHERE county_name = ?`)
};

// Database operations
export const dbOperations = {
  // Initialize database
  init: initDatabase,

  // User operations
  createUser: (userId: string) => {
    statements.insertUser.run(userId);
    statements.updateUserActivity.run(userId);
  },

  updateUserActivity: (userId: string) => {
    statements.updateUserActivity.run(userId);
  },

  // County operations
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
      const userCount = db.prepare(sql`SELECT COUNT(*) as count FROM users`).get() as { count: number };
      const countyCount = db.prepare(sql`SELECT COUNT(*) as count FROM user_counties`).get() as { count: number };

      return {
        users: userCount.count,
        claimedCounties: countyCount.count
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { users: 0, claimedCounties: 0 };
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
