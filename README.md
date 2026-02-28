# GreenRoute - Core29 Sustainability Challenge

A demo-ready web app that makes sustainability **visible** for commuters by comparing transport choices against driving, with gamification features to encourage repeated sustainable behaviour.

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Wait a few seconds for Postgres to be ready.

### 2. Backend

```bash
cd backend
npm install
npm run seed      # Creates schema + seeds demo data (12 users, locations, journeys, achievements)
npm run dev       # Starts API on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # Starts app on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Authentication

The app has a full **Register / Sign In** flow:
- New users register with email, password, and name
- Returning users sign in with email and password
- Accounts are stored in a separate `accounts` table (password hashed with SHA-256)
- A "Continue as Demo User" button is available for quick access

## Location Selection

The journey input features **dropdown location selectors** with:
- **Aberdeen locations**: RGU Garthdee, Aberdeen Train Station, Union Square, University of Aberdeen, Bridge of Don, Dyce, Westhill, Aberdeen Airport, and more
- **Generic locations**: Home, Office, University, Gym, Park, etc.
- When two Aberdeen locations with coordinates are selected, the distance is **auto-calculated** using the Haversine formula (with a 1.3x road distance multiplier)
- Generic locations require manual distance entry

## Demo Mode

Click the **"Demo"** toggle in the header to enable demo mode, which provides:
- Quick-fill buttons ("2km Cycle", "8km Bus", etc.) for smooth demos
- Pre-seeded leaderboards with 12 users
- Populated achievements and streaks

### Demo Flow
1. Click "Continue as Demo User" on the login page
2. Select locations from the dropdown or use a quick-fill button
3. Click "Compare & Log Journey"
4. See the visual comparison vs driving with impact equivalents
5. Navigate to Dashboard to see leaderboards, achievements, and streaks

## Features

### Core
- **Authentication**: Register / Sign In with email and password
- **Journey Input**: Location dropdowns with auto-distance, transport mode, date
- **Calculations**: Time, CO2, calories with driving baseline comparison
- **Visual Comparison**: Side-by-side cards + bar charts

### Gamification
- **Leaderboards**: CO2 Saved, Calories Burned, Best Streak
- **Achievements**: 12 unlockable badges with milestones
- **Streaks**: 3-day, 7-day, 30-day sustainable streak tracking

### Innovation Features
1. **Impact Equivalents**: CO2 saved converted to phone charges, tree-days, LED bulb hours, kettle boils
2. **Health Framing**: Calories converted to jogging/swimming/yoga minutes and chocolate bars
3. **Weekly Goal Mode**: Set and track weekly CO2-saving targets with animated progress bar

## Tech Stack
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Database Tables
- `accounts` - Authentication (email, password_hash)
- `users` - User profiles (linked to account)
- `locations` - Predefined places (Aberdeen + generic)
- `journeys` - Logged journeys with start/end locations
- `journey_results` - Computed stats per journey
- `achievements` - Badge definitions
- `user_achievements` - Earned badges
- `streaks` - Consecutive day tracking
- `weekly_goals` - Weekly CO2 saving targets

## API Endpoints
- `GET  /api/health` - Health check
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Sign in
- `POST /api/users` - Create/get user (demo)
- `GET  /api/users/:id/summary` - User stats summary
- `GET  /api/locations` - All predefined locations
- `GET  /api/locations/distance?from=ID&to=ID` - Calculate distance between locations
- `POST /api/journeys` - Log journey (returns calculations + comparisons)
- `GET  /api/journeys?user_id=` - User journey history
- `GET  /api/leaderboards` - Top CO2/calories/streak leaders
- `GET  /api/achievements?user_id=` - All achievements with earned status
- `POST /api/goals` - Set weekly CO2 goal

## Environment Variables
Backend `.env`:
```
DATABASE_URL=postgresql://core29:core29pass@localhost:5432/sustainability
PORT=3001
```

## Notes
- For Aberdeen locations, distance is auto-calculated via Haversine formula with a road multiplier
- Generic locations require manual distance entry
- All CO2/calorie/time constants are hardcoded for demo reliability (no external APIs)
- Seed data uses randomised journeys for realistic leaderboard feel
- Password hashing uses SHA-256 (demo-grade; use bcrypt for production)
