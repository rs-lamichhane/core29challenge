import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// POST /api/users - create or get demo user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if user exists
    const existing = await query('SELECT * FROM users WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await query(
      'INSERT INTO users (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    // Initialize streak
    await query(
      'INSERT INTO streaks (user_id, current_streak, best_streak) VALUES ($1, 0, 0) ON CONFLICT DO NOTHING',
      [result.rows[0].id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/summary
router.get('/users/:id/summary', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });

    const journeyCount = await query(
      'SELECT COUNT(*) as count FROM journeys WHERE user_id = $1',
      [userId]
    );

    const totals = await query(
      `SELECT
        COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) as total_co2_saved_g,
        COALESCE(SUM(jr.calories_kcal), 0) as total_calories_kcal,
        COALESCE(SUM(jr.vs_drive_calories_delta_kcal), 0) as total_extra_calories
      FROM journeys j
      JOIN journey_results jr ON jr.journey_id = j.id
      WHERE j.user_id = $1`,
      [userId]
    );

    const streak = await query(
      'SELECT current_streak, best_streak, last_journey_date FROM streaks WHERE user_id = $1',
      [userId]
    );

    const badges = await query(
      `SELECT a.key, a.title, a.icon, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    );

    // Weekly goal progress
    const weekStart = getWeekStart();
    const weeklyProgress = await query(
      `SELECT COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) as week_co2_saved
       FROM journeys j
       JOIN journey_results jr ON jr.journey_id = j.id
       WHERE j.user_id = $1 AND j.date >= $2`,
      [userId, weekStart]
    );

    const weeklyGoal = await query(
      'SELECT target_co2_saved_g FROM weekly_goals WHERE user_id = $1 AND week_start = $2',
      [userId, weekStart]
    );

    res.json({
      user_id: userId,
      journey_count: parseInt(journeyCount.rows[0].count),
      total_co2_saved_g: parseFloat(totals.rows[0].total_co2_saved_g),
      total_calories_kcal: parseFloat(totals.rows[0].total_calories_kcal),
      streak: streak.rows[0] || { current_streak: 0, best_streak: 0, last_journey_date: null },
      badges: badges.rows,
      weekly_goal: {
        target_g: weeklyGoal.rows[0]?.target_co2_saved_g || 5000,
        progress_g: parseFloat(weeklyProgress.rows[0].week_co2_saved),
      },
    });
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
