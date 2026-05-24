import "server-only";

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

import { seedIfEmpty } from "./seed";

const defaultPath = path.join(process.cwd(), "data", "friendship-orbit.db");

declare global {
  // eslint-disable-next-line no-var
  var friendshipOrbitDb: Database.Database | undefined;
}

function migrate(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_avatar TEXT
    );

    INSERT OR IGNORE INTO profile (id, user_avatar) VALUES (1, NULL);

    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      closeness INTEGER NOT NULL,
      importance INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal',
      color TEXT NOT NULL,
      angle REAL NOT NULL DEFAULT 0,
      avatar TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friend_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      friend_id TEXT NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
      recorded_at INTEGER NOT NULL,
      old_closeness INTEGER NOT NULL,
      old_importance INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      friend_id TEXT NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, friend_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_history_friend
      ON friend_history(friend_id, recorded_at DESC);
  `);
}

export function getDb(): Database.Database {
  if (globalThis.friendshipOrbitDb) {
    return globalThis.friendshipOrbitDb;
  }

  const dbPath = process.env.DATABASE_PATH ?? defaultPath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  seedIfEmpty(db);

  globalThis.friendshipOrbitDb = db;
  return db;
}
