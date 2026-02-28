import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /api/goals - set weekly CO2 saving goal
router.post('/goals', async (req: Request, res: Response) => {
  try {
    const { user_id, target_co2_saved_g } = req.body;
    if (!user_id || !target_co2_saved_g) {
      return res.status(400).json({ error: 'user_id and target_co2_saved_g required' });
    }

    const weekStart = getWeekStart();
    const result = await query(
      `INSERT INTO weekly_goals (user_id, week_start, target_co2_saved_g)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, week_start)
       DO UPDATE SET target_co2_saved_g = $3
       RETURNING *`,
      [user_id, weekStart, target_co2_saved_g]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export default router;
