CREATE TABLE IF NOT EXISTS users (
  user_key BIGINT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_key BIGINT NOT NULL REFERENCES users(user_key) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horses (
  id UUID PRIMARY KEY,
  user_key BIGINT NOT NULL REFERENCES users(user_key) ON DELETE CASCADE,
  name TEXT NOT NULL,
  speed INT NOT NULL,
  stamina INT NOT NULL,
  accel INT NOT NULL,
  pace TEXT NOT NULL,
  track_apt TEXT NOT NULL,
  distance_apt TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'GOOD',
  fatigue INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_economy (
  user_key BIGINT PRIMARY KEY REFERENCES users(user_key) ON DELETE CASCADE,
  gold INT NOT NULL DEFAULT 200,
  race_stamina INT NOT NULL DEFAULT 8,
  weekend_buff_pct INT NOT NULL DEFAULT 0,
  division_tier INT NOT NULL DEFAULT 1,
  league TEXT NOT NULL DEFAULT 'ROOKIE',
  streak INT NOT NULL DEFAULT 1,
  inventory JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY,
  user_key BIGINT NOT NULL REFERENCES users(user_key),
  mode TEXT NOT NULL,
  race_score INT,
  place INT,
  dnf BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS division_rooms (
  id TEXT PRIMARY KEY,
  week_id TEXT NOT NULL,
  league TEXT NOT NULL,
  tier INT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_settlements (
  id UUID PRIMARY KEY,
  user_key BIGINT NOT NULL,
  week_id TEXT NOT NULL,
  gold INT NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_key ON sessions(user_key);
CREATE INDEX IF NOT EXISTS idx_race_results_user_week ON race_results(user_key, created_at);
