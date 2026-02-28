import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/leaderboards
router.get('/leaderboards', async (_req: Request, res: Response) => {
  try {
    const co2Leaders = await query(
      `SELECT u.id, u.name, u.avatar_color,
              COALESCE(SUM(jr.vs_drive_co2_saved_g), 0)::NUMERIC as total_co2_saved_g
       FROM users u
       LEFT JOIN journeys j ON j.user_id = u.id
       LEFT JOIN journey_results jr ON jr.journey_id = j.id
       GROUP BY u.id, u.name, u.avatar_color
       HAVING COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) > 0
       ORDER BY total_co2_saved_g DESC
       LIMIT 10`
    );

    const calorieLeaders = await query(
      `SELECT u.id, u.name, u.avatar_color,
              COALESCE(SUM(jr.calories_kcal), 0)::NUMERIC as total_calories
       FROM users u
       LEFT JOIN journeys j ON j.user_id = u.id
       LEFT JOIN journey_results jr ON jr.journey_id = j.id
       GROUP BY u.id, u.name, u.avatar_color
       HAVING COALESCE(SUM(jr.calories_kcal), 0) > 0
       ORDER BY total_calories DESC
       LIMIT 10`
    );

    const streakLeaders = await query(
      `SELECT u.id, u.name, u.avatar_color, s.best_streak, s.current_streak
       FROM users u
       JOIN streaks s ON s.user_id = u.id
       WHERE s.best_streak > 0
       ORDER BY s.best_streak DESC, s.current_streak DESC
       LIMIT 10`
    );

    res.json({
      co2: co2Leaders.rows.map((r, i) => ({ ...r, rank: i + 1, total_co2_saved_g: parseFloat(r.total_co2_saved_g) })),
      calories: calorieLeaders.rows.map((r, i) => ({ ...r, rank: i + 1, total_calories: parseFloat(r.total_calories) })),
      streaks: streakLeaders.rows.map((r, i) => ({ ...r, rank: i + 1 })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
