# EcoJourney 2.0: Sustainable Travel Decision Tool

EcoJourney 2.0 is an innovative, high-impact solution for visualizing and encouraging sustainable travel choices.

## 🌟 Features
- **Premium Glassmorphism UI**: modern, high-contrast design.
- **Interactive Journey Planner**: logging and impact visualization.
- **PWA Ready**: installable and offline capable.
- **Containerized**: docker-compose ready.
- **Automated CI**: GitHub Actions workflow.

## 🚀 Get Started
```bash
docker-compose up --build
```
Access at `http://localhost:80`.

## 📂 Structure
- `/frontend`: React + Vite + PWA
- `/backend`: Node + TS + Express
- `/db`: PostgreSQL Schema

## 🧠 Hackathon Roadmap Ideas 

These ideas are aimed at maximizing demo impact for judges while fitting a short hackathon window.

### 🚀 High-Impact Quick Wins (6–12 hours)
- **Visual Streak Flame**: Replace static streak text with a dynamic SVG flame that scales by `user_stats.current_streak`.
- **Trees / Cars Equivalent Converter**: Translate `co2_saved_kg` into tangible comparisons (trees planted, cars off road/day).
- **Mode-Specific Leaderboards**: Add tabs for "Top Cyclists" and "CO2 Savers" using SQL aggregates from `journeys`.
- **Instant Badges on Journey Log**: Trigger badge unlocks (e.g., first trip, 20kg saver) directly after `/api/journeys`.

### 🏆 Differentiators for Judges
- **Local RGU Leaderboard**: Add team/event filter (e.g., `team_id`) to show a dedicated "RGU Hackathon" top 10.
- **Impact Radial Chart**: Visualize personal CO2 saved against community average from `user_stats`.
- **CO2 Cloud Dissipation Animation**: Shrinking cloud effect tied to cumulative CO2 savings to make impact emotional and visible.

### 🎮 Engagement Mechanics
- **Daily Challenges**: Add challenge quests (distance/mode goals) with points and streak bonuses.
- **Streak Recovery Challenges**: Allow users to recover broken streaks through small tasks and reflection input.
- **Challenge a Friend**: Shareable head-to-head challenge links from leaderboard rows.

### 🌦️ Smart Context Feature
- **Weather-Based Commute Nudges**: Use weather API to suggest greener modes and reward acceptance with bonus points.

## 🛠️ Suggested Backend Endpoints for the Roadmap
- `GET /api/user/streak`
- `POST /api/streak/recover`
- `GET /api/leaderboard?scope=global|rgu&metric=co2|streak|calories`
- `GET /api/stats/community-avg`
- `GET /api/user/badges`
- `GET /api/challenges/daily`
- `POST /api/challenges/complete`

## 🗃️ Suggested Schema Extensions
- `badges` (id, user_id, badge_key, earned_at)
- `streak_breaks` (id, user_id, reason, created_at)
- `challenges` (id, title, rule_type, target_value, points, active_date)
- `user_challenges` (id, user_id, challenge_id, status, completed_at)
- Optional: `team_id` on `users` for hackathon/community leaderboard scoping
