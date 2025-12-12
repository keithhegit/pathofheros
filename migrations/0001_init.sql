CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  gold INTEGER NOT NULL,
  upgrade_cost INTEGER NOT NULL,
  stats TEXT NOT NULL,
  inventory TEXT NOT NULL,
  skills TEXT NOT NULL,
  map_progress TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

