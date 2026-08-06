-- NutriMind D1 Database Schema
-- Run: wrangler d1 execute nutrimind-db --local --file=schema.sql

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS user_profiles (
  session_id TEXT PRIMARY KEY,
  age INTEGER,
  height_cm REAL,
  weight_kg REAL,
  goal TEXT,
  bmi REAL,
  bmi_category TEXT,
  daily_calories INTEGER,
  wellness_score INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS mood_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  mood_score INTEGER NOT NULL,
  note TEXT,
  recorded_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS weight_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  recorded_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
