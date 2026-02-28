import { Router, Request, Response } from 'express';
import { query } from '../db';
import { calculateJourney, getImpactEquivalents, getCalorieEquivalents, TransportMode } from '../utils/calculations';

const router = Router();
const VALID_MODES: TransportMode[] = ['walk', 'cycle', 'e-scooter', 'bus', 'train', 'drive'];

// POST /api/journeys - log a journey
router.post('/journeys', async (req: Request, res: Response) => {
  try {
    const { user_id, date, distance_km, mode, start_location_id, end_location_id } = req.body;

    // Validation
    if (!user_id || !distance_km || !mode) {
      return res.status(400).json({ error: 'user_id, distance_km, and mode are required' });
    }
    if (typeof distance_km !== 'number' || distance_km <= 0 || distance_km > 500) {
      return res.status(400).json({ error: 'distance_km must be between 0 and 500' });
    }
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` });
    }

    const journeyDate = date || new Date().toISOString().split('T')[0];

    // Calculate
    const calc = calculateJourney(distance_km, mode as TransportMode);

    // Insert journey
    const journeyResult = await query(
      'INSERT INTO journeys (user_id, date, distance_km, mode, start_location_id, end_location_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, journeyDate, distance_km, mode, start_location_id || null, end_location_id || null]
    );
    const journey = journeyResult.rows[0];

    // Insert results
    await query(
      `INSERT INTO journey_results
        (journey_id, time_min, co2_g, calories_kcal, vs_drive_co2_saved_g, vs_drive_time_delta_min, vs_drive_calories_delta_kcal, drive_time_min, drive_co2_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [journey.id, calc.time_min, calc.co2_g, calc.calories_kcal,
       calc.vs_drive_co2_saved_g, calc.vs_drive_time_delta_min, calc.vs_drive_calories_delta_kcal,
       calc.drive_time_min, calc.drive_co2_g]
    );

    // Update streak (only for non-driving modes)
    if (mode !== 'drive') {
      await updateStreak(user_id, journeyDate);
    }

    // Check and award achievements
    const newAchievements = await checkAchievements(user_id);

    // Build response with impact equivalents
    const impactEquivalents = getImpactEquivalents(calc.vs_drive_co2_saved_g);
    const calorieEquivalents = getCalorieEquivalents(calc.calories_kcal);

    res.status(201).json({
      journey,
      results: calc,
      impact_equivalents: impactEquivalents,
      calorie_equivalents: calorieEquivalents,
      new_achievements: newAchievements,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/journeys?user_id=...
router.get('/journeys', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id query param required' });

    const result = await query(
      `SELECT j.*, jr.time_min, jr.co2_g, jr.calories_kcal,
              jr.vs_drive_co2_saved_g, jr.vs_drive_time_delta_min,
              jr.vs_drive_calories_delta_kcal, jr.drive_time_min, jr.drive_co2_g
       FROM journeys j
       JOIN journey_results jr ON jr.journey_id = j.id
       WHERE j.user_id = $1
       ORDER BY j.date DESC, j.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function updateStreak(userId: number, journeyDate: string) {
  const streakRow = await query('SELECT * FROM streaks WHERE user_id = $1', [userId]);

  if (streakRow.rows.length === 0) {
    await query(
      'INSERT INTO streaks (user_id, current_streak, best_streak, last_journey_date) VALUES ($1, 1, 1, $2)',
      [userId, journeyDate]
    );
    return;
  }

  const s = streakRow.rows[0];
  const lastDate = s.last_journey_date ? new Date(s.last_journey_date) : null;
  const today = new Date(journeyDate);

  if (lastDate) {
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      const newStreak = s.current_streak + 1;
      const bestStreak = Math.max(newStreak, s.best_streak);
      await query(
        'UPDATE streaks SET current_streak = $1, best_streak = $2, last_journey_date = $3 WHERE user_id = $4',
        [newStreak, bestStreak, journeyDate, userId]
      );
    } else {
      // Streak broken
      await query(
        'UPDATE streaks SET current_streak = 1, last_journey_date = $1 WHERE user_id = $2',
        [journeyDate, userId]
      );
    }
  } else {
    await query(
      'UPDATE streaks SET current_streak = 1, best_streak = GREATEST(best_streak, 1), last_journey_date = $1 WHERE user_id = $2',
      [journeyDate, userId]
    );
  }
}

async function checkAchievements(userId: number): Promise<any[]> {
  const newlyEarned: any[] = [];

  // Get user stats
  const stats = await query(
    `SELECT
      COUNT(*) as journey_count,
      COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) as total_co2_saved,
      COALESCE(SUM(jr.calories_kcal), 0) as total_calories
    FROM journeys j
    JOIN journey_results jr ON jr.journey_id = j.id
    WHERE j.user_id = $1`,
    [userId]
  );

  const streak = await query('SELECT current_streak FROM streaks WHERE user_id = $1', [userId]);

  const s = stats.rows[0];
  const currentStreak = streak.rows[0]?.current_streak || 0;

  // Get all achievements not yet earned
  const unearned = await query(
    `SELECT a.* FROM achievements a
     WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)`,
    [userId]
  );

  for (const ach of unearned.rows) {
    let qualifies = false;

    switch (ach.threshold_type) {
      case 'journey_count':
        qualifies = parseInt(s.journey_count) >= parseFloat(ach.threshold_value);
        break;
      case 'co2_saved_g':
        qualifies = parseFloat(s.total_co2_saved) >= parseFloat(ach.threshold_value);
        break;
      case 'calories_kcal':
        qualifies = parseFloat(s.total_calories) >= parseFloat(ach.threshold_value);
        break;
      case 'streak':
        qualifies = currentStreak >= parseFloat(ach.threshold_value);
        break;
    }

    if (qualifies) {
      await query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, ach.id]
      );
      newlyEarned.push({ key: ach.key, title: ach.title, icon: ach.icon, description: ach.description });
    }
  }

  return newlyEarned;
}

export default router;
