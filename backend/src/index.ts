import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

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

// Simple deterministic hash to get a repeatable "distance" from two place names
function estimateDistance(origin: string, destination: string): number {
    const combined = (origin + destination).toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 570 + 30) / 10;
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
app.post('/api/plan', (req, res) => {
    const { origin, destination, preferredMode, timeAvailableMin, originLat, originLng } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'origin and destination are required' });
    }

    const distanceKm = estimateDistance(origin, destination);

    const alternatives = MODES.map((m) => {
        const co2Kg = Math.round(m.co2PerKm * distanceKm * 1000) / 1000;
        const timeMin = Math.round((distanceKm / m.speedKmh) * 60);
        const calories = Math.round(m.calPerKm * distanceKm);
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

    const pois = generatePOIs(origin, originLat, originLng);

    res.json({ origin, destination, distanceKm, alternatives, greenSuggestion, pois });
});

// ── GET /api/nearby — transport POIs around a location ──
app.get('/api/nearby', (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 57.15;
    const lng = parseFloat(req.query.lng as string) || -2.11;
    const name = (req.query.name as string) || 'Your location';

    const pois = [
        { type: 'bus_stop', emoji: '🚌', name: `Bus stop — High Street`, lat: lat + 0.001, lng: lng + 0.002, distanceKm: 0.08, nextDeparture: '3 min' },
        { type: 'bus_stop', emoji: '🚌', name: `Bus stop — Station Road`, lat: lat - 0.0015, lng: lng + 0.001, distanceKm: 0.15, nextDeparture: '7 min' },
        { type: 'bus_stop', emoji: '🚌', name: `Bus stop — University Campus`, lat: lat + 0.003, lng: lng - 0.002, distanceKm: 0.32, nextDeparture: '12 min' },
        { type: 'bike_share', emoji: '🚲', name: `Bike share — City Centre`, lat: lat + 0.002, lng: lng - 0.001, distanceKm: 0.21, nextDeparture: 'Available now' },
        { type: 'bike_share', emoji: '🚲', name: `Bike share — Harbour`, lat: lat - 0.004, lng: lng + 0.003, distanceKm: 0.45, nextDeparture: 'Available now' },
        { type: 'train_station', emoji: '🚆', name: `Train station — ${name}`, lat: lat - 0.003, lng: lng + 0.004, distanceKm: 0.38, nextDeparture: '15 min' },
        { type: 'taxi_rank', emoji: '🚕', name: `Taxi rank — Main Square`, lat: lat + 0.0005, lng: lng - 0.003, distanceKm: 0.12, nextDeparture: 'Available now' },
        { type: 'car_park', emoji: '🅿️', name: `Car park — Multi-storey`, lat: lat - 0.002, lng: lng - 0.002, distanceKm: 0.25, nextDeparture: '142 spaces' },
        { type: 'scooter', emoji: '🛴', name: `E-scooter — Dock A`, lat: lat + 0.0018, lng: lng + 0.0025, distanceKm: 0.18, nextDeparture: '3 available' },
    ];

    res.json({ lat, lng, pois });
});

// Legacy endpoint
app.post('/api/journeys', async (req, res) => {
    const { userId, distanceKm, mode } = req.body;
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
