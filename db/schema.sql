-- EcoJourney Schema 2.0

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    transport_mode VARCHAR(50) NOT NULL,
    co2_saved_kg DECIMAL(10, 3) NOT NULL,
    calories_burned DECIMAL(10, 2) NOT NULL,
    travel_time_min INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    total_co2_saved DECIMAL(10, 3) DEFAULT 0,
    total_calories_burned DECIMAL(10, 2) DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_journey_at TIMESTAMP WITH TIME ZONE
);

-- Seed some initial data
INSERT INTO users (username, email, password_hash) VALUES ('demo_user', 'demo@example.com', 'hashed_pass') ON CONFLICT DO NOTHING;
INSERT INTO user_stats (user_id) SELECT id FROM users WHERE username = 'demo_user' ON CONFLICT DO NOTHING;
