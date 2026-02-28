-- Core29 Sustainability App - Database Schema

-- Authentication table (separate from user profile)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predefined locations with coordinates for distance calculation
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'generic',
  lat NUMERIC(10,7),
  lng NUMERIC(10,7)
);

CREATE TABLE IF NOT EXISTS journeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_location_id INTEGER REFERENCES locations(id),
  end_location_id INTEGER REFERENCES locations(id),
  distance_km NUMERIC(8,2) NOT NULL CHECK (distance_km > 0),
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('walk','cycle','e-scooter','bus','train','drive','boat','plane')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_results (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL UNIQUE REFERENCES journeys(id) ON DELETE CASCADE,
  time_min NUMERIC(8,2) NOT NULL,
  co2_g NUMERIC(10,2) NOT NULL,
  calories_kcal NUMERIC(8,2) NOT NULL,
  vs_drive_co2_saved_g NUMERIC(10,2) NOT NULL,
  vs_drive_time_delta_min NUMERIC(8,2) NOT NULL,
  vs_drive_calories_delta_kcal NUMERIC(8,2) NOT NULL,
  drive_time_min NUMERIC(8,2) NOT NULL,
  drive_co2_g NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '🏆',
  threshold_type VARCHAR(30) NOT NULL,
  threshold_value NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_journey_date DATE
);

-- Weekly goals table (innovation feature)
CREATE TABLE IF NOT EXISTS weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target_co2_saved_g NUMERIC(10,2) NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journeys_user_id ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_date ON journeys(date);
CREATE INDEX IF NOT EXISTS idx_journey_results_journey_id ON journey_results(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
