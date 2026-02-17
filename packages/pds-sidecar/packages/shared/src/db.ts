import Database from 'better-sqlite3';

export function createDatabase(path: string): Database.Database {
  const db = new Database(path);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      did TEXT UNIQUE,
      handle TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create otp_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create rate_limits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      window_start TEXT NOT NULL
    )
  `);

  return db;
}
