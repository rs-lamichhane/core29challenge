import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/journeys', async (req, res) => {
    const { userId, distanceKm, mode } = req.body;
    // Logic for calculations...
    const co2Factor = mode === 'DRIVING' ? 0.17 : (mode === 'PUBLIC' ? 0.04 : 0);
    const co2Saved = (0.17 - co2Factor) * distanceKm;
    const calories = (mode === 'WALKING' ? 50 : (mode === 'CYCLING' ? 30 : 0)) * distanceKm;

    try {
        const result = await pool.query(
            'INSERT INTO journeys (user_id, origin, destination, distance_km, transport_mode, co2_saved_kg, calories_burned, travel_time_min) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [userId || 1, 'Point A', 'Point B', distanceKm, mode, co2Saved, calories, 15]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB Error' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on ${port}`));
