import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/achievements?user_id=...
router.get('/achievements', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id query param required' });

    const all = await query('SELECT * FROM achievements ORDER BY id');
    const earned = await query(
      'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1',
      [userId]
    );

    const earnedMap = new Map(earned.rows.map((r: any) => [r.achievement_id, r.earned_at]));

    const achievements = all.rows.map((a: any) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earned_at: earnedMap.get(a.id) || null,
    }));

    res.json(achievements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
