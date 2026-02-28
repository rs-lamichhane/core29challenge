import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Transport mode config ──
const MODES = [
    { key: 'walking', label: 'Walking', emoji: '🚶', co2PerKm: 0.0, speedKmh: 5, calPerKm: 50, enjoyment: 4 },
    { key: 'running', label: 'Running', emoji: '🏃', co2PerKm: 0.0, speedKmh: 10, calPerKm: 70, enjoyment: 5 },
    { key: 'cycling', label: 'Cycling', emoji: '🚲', co2PerKm: 0.0, speedKmh: 15, calPerKm: 30, enjoyment: 5 },
    { key: 'bus', label: 'Bus', emoji: '🚌', co2PerKm: 0.04, speedKmh: 25, calPerKm: 0, enjoyment: 3 },
    { key: 'train', label: 'Train', emoji: '🚆', co2PerKm: 0.03, speedKmh: 60, calPerKm: 0, enjoyment: 4 },
    { key: 'car', label: 'Car', emoji: '🚗', co2PerKm: 0.17, speedKmh: 40, calPerKm: 0, enjoyment: 2 },
    { key: 'plane', label: 'Plane', emoji: '✈️', co2PerKm: 0.255, speedKmh: 800, calPerKm: 0, enjoyment: 3 },
];

// ── Geocoding & Distance ──
async function geocode(place: string): Promise<{ lat: number, lng: number } | null> {
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'EcoJourney Planner / 1.0 (local dev)' }
        });
        const data = await r.json() as any[];
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) {
        console.error('Geocode error:', e);
    }
    return null;
}

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Generate mock nearby POIs with lat/lng offsets from a center point
function generatePOIs(originName: string, lat?: number, lng?: number) {
    const baseLat = lat || 57.15;
    const baseLng = lng || -2.11;

    const poiTemplates = [
        { type: 'bus_stop', emoji: '🚌', name: `Bus stop — ${originName} High St`, lat: baseLat + 0.001, lng: baseLng + 0.002 },
        { type: 'bus_stop', emoji: '🚌', name: `Bus stop — ${originName} Station Rd`, lat: baseLat - 0.0015, lng: baseLng + 0.001 },
        { type: 'bike_share', emoji: '🚲', name: `Bike share — ${originName} Centre`, lat: baseLat + 0.002, lng: baseLng - 0.001 },
        { type: 'train_station', emoji: '🚆', name: `Train station — ${originName}`, lat: baseLat - 0.003, lng: baseLng + 0.004 },
        { type: 'taxi_rank', emoji: '🚕', name: `Taxi rank — ${originName} Square`, lat: baseLat + 0.0005, lng: baseLng - 0.003 },
        { type: 'car_park', emoji: '🅿️', name: `Car park — ${originName} Multi-storey`, lat: baseLat - 0.002, lng: baseLng - 0.002 },
    ];

    const count = 3 + (originName.length % 4);
    return poiTemplates.slice(0, Math.min(count, poiTemplates.length)).map((p, i) => ({
        ...p,
        distanceKm: Math.round((0.05 + ((i * 0.13 + originName.length * 0.03) % 0.45)) * 100) / 100,
    }));
}

// ── POST /api/plan — journey comparison ──
app.post('/api/plan', async (req, res) => {
    const { origin, destination, preferredMode, timeAvailableMin, originLat, originLng } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'origin and destination are required' });
    }

    let oLat = originLat, oLng = originLng;
    if (!oLat || !oLng) {
        const oGeo = await geocode(origin);
        if (oGeo) { oLat = oGeo.lat; oLng = oGeo.lng; }
        else { oLat = 57.15; oLng = -2.11; } // fallback Aberdeen
    }

    const dGeo = await geocode(destination);
    const dLat = dGeo ? dGeo.lat : oLat + 0.1;
    const dLng = dGeo ? dGeo.lng : oLng + 0.1;

    let distanceKm = haversineDist(oLat, oLng, dLat, dLng);
    distanceKm = Math.max(0.1, Math.round(distanceKm * 10) / 10); // at least 100m

    // Fallback if exactly the same place
    if (distanceKm < 0.2) distanceKm = 0.5;

    const alternatives = MODES.map((m) => {
        // Compute walking distance to/from transport
        let walkToTransportKm = 0;
        if (m.key === 'bus' || m.key === 'train' || m.key === 'plane') {
            walkToTransportKm = Math.round((Math.random() * 0.8 + 0.2) * 10) / 10; // 0.2 to 1.0 km walk
        }

        const co2Kg = Math.round(m.co2PerKm * distanceKm * 1000) / 1000;
        const timeMin = Math.round((distanceKm / m.speedKmh) * 60) + Math.round((walkToTransportKm / 5) * 60);
        const calories = Math.round(m.calPerKm * distanceKm) + Math.round(50 * walkToTransportKm);
        const tooSlow = timeAvailableMin ? timeMin > timeAvailableMin : false;
        return {
            mode: m.key,
            label: m.label,
            emoji: m.emoji,
            co2Kg,
            timeMin,
            calories,
            enjoyment: m.enjoyment,
            tooSlow,
            walkToTransportKm
        };
    }).sort((a, b) => a.co2Kg - b.co2Kg);

    // Green suggestion
    let greenSuggestion = null;
    const preferred = alternatives.find((a) => a.mode === (preferredMode || '').toLowerCase());
    const greenest = alternatives.filter(a => !a.tooSlow)[0] || alternatives[0];
    if (preferred && preferred.co2Kg > greenest.co2Kg) {
        greenSuggestion = {
            currentMode: preferred.label,
            suggestedMode: greenest.label,
            suggestedEmoji: greenest.emoji,
            co2SavedKg: Math.round((preferred.co2Kg - greenest.co2Kg) * 1000) / 1000,
        };
    }

    const pois = generatePOIs(origin, oLat, oLng);

    res.json({ origin, destination, distanceKm, alternatives, greenSuggestion, pois, originLat: oLat, originLng: oLng, destLat: dLat, destLng: dLng });
});

async function fetchRealPOIs(lat: number, lng: number) {
    const query = `
        [out:json];
        (
            node["highway"="bus_stop"](around:800,${lat},${lng});
            node["railway"="station"](around:3000,${lat},${lng});
            node["aeroway"="aerodrome"](around:10000,${lat},${lng});
        );
        out body;
    `;
    try {
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'EcoJourney Planner' } });
        const data = await r.json() as any;

        let pois = data.elements.map((el: any) => {
            let isTrain = el.tags?.railway === 'station';
            let isPlane = el.tags?.aeroway === 'aerodrome';
            let type = isPlane ? 'airport' : (isTrain ? 'train_station' : 'bus_stop');
            let emoji = isPlane ? '✈️' : (isTrain ? '🚆' : '🚌');
            let typeName = isPlane ? 'Airport' : (isTrain ? 'Train Station' : 'Bus Stop');

            let name = el.tags?.name || typeName;

            const distKm = Math.round(haversineDist(lat, lng, el.lat, el.lon) * 100) / 100;
            return {
                type, name, emoji, lat: el.lat, lng: el.lon, distanceKm: distKm,
                nextDeparture: isPlane ? 'Check flights' : Math.floor(Math.random() * 15 + 2) + ' min'
            };
        });

        pois.push({ type: 'bike_share', emoji: '🚲', name: 'Bike share — Nearby', lat: lat + 0.001, lng: lng - 0.001, distanceKm: 0.15, nextDeparture: 'Available now' });
        return pois.sort((a: any, b: any) => a.distanceKm - b.distanceKm).slice(0, 15);
    } catch (e) {
        console.error('Overpass error:', e);
        return [];
    }
}

// ── GET /api/nearby — transport POIs around a location ──
app.get('/api/nearby', async (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 57.15;
    const lng = parseFloat(req.query.lng as string) || -2.11;
    const name = (req.query.name as string) || 'Your location';

    let pois = await fetchRealPOIs(lat, lng);

    if (pois.length === 0) {
        pois = [
            { type: 'bus_stop', emoji: '🚌', name: `Bus stop — High Street`, lat: lat + 0.001, lng: lng + 0.002, distanceKm: 0.08, nextDeparture: '3 min' },
            { type: 'train_station', emoji: '🚆', name: `Train station — ${name}`, lat: lat - 0.003, lng: lng + 0.004, distanceKm: 0.38, nextDeparture: '15 min' },
        ];
    }

    res.json({ lat, lng, pois });
});

const JWT_SECRET = process.env.JWT_SECRET || 'ecojourney_super_secret_key';

// ── Auth Endpoints ──
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hash]
        );
        res.json({ message: 'User registered', user: result.rows[0] });
    } catch (err: any) {
        if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        await pool.query('INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

        res.json({ message: 'Logged in', token, user: { id: user.id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Journeys & Stats ──
app.post('/api/journeys', async (req, res) => {
    const { userId, origin, destination, distanceKm, transportMode, co2SavedKg, caloriesBurned, travelTimeMin } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO journeys (user_id, origin, destination, distance_km, transport_mode, co2_saved_kg, calories_burned, travel_time_min) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [userId, origin, destination, distanceKm, transportMode, co2SavedKg, caloriesBurned, travelTimeMin]
        );

        await pool.query(
            'UPDATE user_stats SET total_co2_saved = total_co2_saved + $1, total_calories_burned = total_calories_burned + $2, last_journey_at = CURRENT_TIMESTAMP WHERE user_id = $3',
            [co2SavedKg, caloriesBurned, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.get('/api/user/stats', async (req, res) => {
    const userId = req.query.userId;
    try {
        const stats = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
        const today = await pool.query("SELECT COALESCE(SUM(co2_saved_kg), 0) as today_co2 FROM journeys WHERE user_id = $1 AND created_at >= CURRENT_DATE", [userId]);
        const totalJourneys = await pool.query('SELECT COUNT(*) as j_count FROM journeys WHERE user_id = $1', [userId]);

        res.json({
            ...stats.rows[0],
            today_co2: today.rows[0].today_co2,
            journeys: totalJourneys.rows[0].j_count
        });
    } catch (err) {
        res.status(500).json({ error: 'DB Error' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on ${port}`));
