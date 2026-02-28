# CO2 Racer ⚡

**Race your carbon shadow.** A mobile-first PWA built for the Core29 Challenge at RGU Aberdeen.

## What It Does
Enter a journey and watch three race lanes animate side-by-side: 🚗 Car vs 🚌 Bus vs 🚶 Walk. See exactly how much CO₂ each mode produces — and watch your screen fill with volumetric smog when you choose to drive.

## Features
- **3-Lane Carbon Race** — Visual comparison with animated CO₂ trails
- **Volumetric Smog** — Choosing "Car" fills your screen with a visceral smog overlay
- **Scottish Grid Sync** — Real-time wind power status for Aberdeen
- **Streak System** — 3-day, 7-day, 30-day green commute streaks
- **Leaderboard** — Compete for "Top CO₂ Saver This Week"
- **Achievement Badges** — Unlock milestones for sustainable travel

## Tech Stack
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Infra**: Docker Compose + Cloudflare Tunnel
- **Design**: Dark Mode Glassmorphism (Deep Space Black + Neon Mint)

## Run Locally
```bash
docker compose up --build
```
- **App**: http://localhost:80
- **API**: http://localhost:3000/api/health

## Live Demo
- **App**: https://app.sydney.it.com
- **API**: https://api.sydney.it.com/api/health
