import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/locations - get all predefined locations
router.get('/locations', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, category, lat, lng FROM locations ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/distance?from=ID&to=ID - calculate distance between two locations
router.get('/locations/distance', async (req: Request, res: Response) => {
  try {
    const fromId = parseInt(req.query.from as string);
    const toId = parseInt(req.query.to as string);

    if (isNaN(fromId) || isNaN(toId)) {
      return res.status(400).json({ error: 'from and to location IDs are required' });
    }

    const fromLoc = await query('SELECT * FROM locations WHERE id = $1', [fromId]);
    const toLoc = await query('SELECT * FROM locations WHERE id = $1', [toId]);

    if (fromLoc.rows.length === 0 || toLoc.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const from = fromLoc.rows[0];
    const to = toLoc.rows[0];

    // If both have coordinates, calculate haversine distance
    if (from.lat && from.lng && to.lat && to.lng) {
      const distance = haversineKm(
        parseFloat(from.lat), parseFloat(from.lng),
        parseFloat(to.lat), parseFloat(to.lng)
      );
      return res.json({
        from: from.name,
        to: to.name,
        distance_km: Math.round(distance * 10) / 10,
        method: 'haversine',
      });
    }

    // If generic locations, return null distance (user must enter manually)
    return res.json({
      from: from.name,
      to: to.name,
      distance_km: null,
      method: 'manual',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Haversine formula
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by ~1.3 to approximate road distance vs straight line
  return R * c * 1.3;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
