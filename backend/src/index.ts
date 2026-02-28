import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'ClearPath' }));

// Compare journey modes
app.post('/api/journey', async (req, res) => {
    const { from, to, distanceKm, userId } = req.body;
    const km = parseFloat(distanceKm) || 5;

    const modes = [
        { mode: 'CAR', co2PerKm: 0.17, calPerKm: 0, speedKmh: 35 },
        { mode: 'BUS', co2PerKm: 0.04, calPerKm: 5, speedKmh: 20 },
        { mode: 'CYCLE', co2PerKm: 0, calPerKm: 30, speedKmh: 15 },
        { mode: 'WALK', co2PerKm: 0, calPerKm: 50, speedKmh: 5 },
    ];

    const carCo2 = 0.17 * km;
    const results = modes.map(m => ({
        mode: m.mode,
        time_min: Math.round((km / m.speedKmh) * 60),
        co2_kg: +(m.co2PerKm * km).toFixed(3),
        calories: Math.round(m.calPerKm * km),
        co2_saved_vs_car: +((carCo2 - m.co2PerKm * km)).toFixed(3),
        saving_percent: Math.round(((carCo2 - m.co2PerKm * km) / carCo2) * 100),
    }));

    try {
        await pool.query(
            'INSERT INTO journeys (user_id, origin, destination, distance_km, transport_mode, co2_saved_kg, calories_burned, travel_time_min) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [userId || 1, from || 'Origin', to || 'Destination', km, 'COMPARISON', 0, 0, 0]
        );
    } catch (_e) { /* non-critical */ }

    res.json({ from, to, distance_km: km, modes: results });
});

// Drive mode — log CO2 silently
app.post('/api/drive', async (req, res) => {
    const { userId, distanceKm } = req.body;
    const km = parseFloat(distanceKm) || 0;
    const co2 = +(0.17 * km).toFixed(3);

    try {
        await pool.query(
            'INSERT INTO journeys (user_id, origin, destination, distance_km, transport_mode, co2_saved_kg, calories_burned, travel_time_min) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [userId || 1, 'Drive Start', 'Drive End', km, 'CAR', 0, 0, 0]
        );
    } catch (_e) { /* non-critical */ }

    res.json({ logged: true, co2_kg: co2, distance_km: km });
});

// Streaks
app.get('/api/streaks/:userId', (_req, res) => {
    res.json({
        current_streak: 12, longest_streak: 18, total_co2_saved: 42.5,
        milestones: [
            { label: '3-Day Sustainable', done: true },
            { label: '7-Day Low-Carbon', done: true },
            { label: '30-Day Green Habit', done: false },
        ],
    });
});

// Leaderboard
app.get('/api/leaderboard', (_req, res) => {
    res.json([
        { rank: 1, name: 'You', co2_saved: 42.5, calories: 3200 },
        { rank: 2, name: 'Alex M.', co2_saved: 38.1, calories: 2800 },
        { rank: 3, name: 'Sarah K.', co2_saved: 35.7, calories: 2400 },
        { rank: 4, name: 'Jamie R.', co2_saved: 29.2, calories: 1900 },
        { rank: 5, name: 'Priya D.', co2_saved: 24.0, calories: 1600 },
    ]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ClearPath API on ${port}`));
