import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /api/notifications/subscribe - save push subscription
router.post('/notifications/subscribe', async (req: Request, res: Response) => {
  try {
    const { user_id, subscription } = req.body;
    if (!user_id || !subscription) {
      return res.status(400).json({ error: 'user_id and subscription required' });
    }

    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [user_id, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/unsubscribe - remove push subscription
router.post('/notifications/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [user_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/status?user_id=... - check subscription status
router.get('/notifications/status', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id required' });

    const result = await query(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    res.json({ subscribed: parseInt(result.rows[0].count) > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
