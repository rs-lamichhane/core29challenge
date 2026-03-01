import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/battles?user_id=... - get all battles for a user
router.get('/battles', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id required' });

    const result = await query(
      `SELECT fb.*,
              c.name as challenger_name, c.avatar_color as challenger_color,
              o.name as opponent_name, o.avatar_color as opponent_color,
              w.name as winner_name
       FROM friend_battles fb
       JOIN users c ON c.id = fb.challenger_id
       JOIN users o ON o.id = fb.opponent_id
       LEFT JOIN users w ON w.id = fb.winner_id
       WHERE fb.challenger_id = $1 OR fb.opponent_id = $1
       ORDER BY fb.created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles - create a new battle challenge
router.post('/battles', async (req: Request, res: Response) => {
  try {
    const { challenger_id, opponent_name, duration_days } = req.body;

    if (!challenger_id || !opponent_name) {
      return res.status(400).json({ error: 'challenger_id and opponent_name are required' });
    }

    // Find opponent by name
    const opponentResult = await query(
      'SELECT id, name FROM users WHERE LOWER(name) = LOWER($1) AND id != $2 LIMIT 1',
      [opponent_name, challenger_id]
    );

    if (opponentResult.rows.length === 0) {
      return res.status(404).json({ error: `No user found with name "${opponent_name}". They need to register first!` });
    }

    const opponent = opponentResult.rows[0];
    const days = duration_days || 7;

    // Check for existing active battle between these users
    const existing = await query(
      `SELECT id FROM friend_battles
       WHERE status IN ('pending', 'active')
       AND ((challenger_id = $1 AND opponent_id = $2) OR (challenger_id = $2 AND opponent_id = $1))`,
      [challenger_id, opponent.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active battle with this user!' });
    }

    const result = await query(
      `INSERT INTO friend_battles (challenger_id, opponent_id, status, start_date, end_date)
       VALUES ($1, $2, 'active', CURRENT_DATE, CURRENT_DATE + $3 * INTERVAL '1 day')
       RETURNING *`,
      [challenger_id, opponent.id, days]
    );

    const battle = result.rows[0];

    res.status(201).json({
      ...battle,
      challenger_name: (await query('SELECT name FROM users WHERE id=$1', [challenger_id])).rows[0]?.name,
      opponent_name: opponent.name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles/:id/accept - accept a battle
router.post('/battles/:id/accept', async (req: Request, res: Response) => {
  try {
    const battleId = req.params.id;
    const { user_id } = req.body;

    const result = await query(
      `UPDATE friend_battles SET status = 'active'
       WHERE id = $1 AND opponent_id = $2 AND status = 'pending'
       RETURNING *`,
      [battleId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found or already active' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles/:id/decline - decline a battle
router.post('/battles/:id/decline', async (req: Request, res: Response) => {
  try {
    const battleId = req.params.id;
    const { user_id } = req.body;

    await query(
      `UPDATE friend_battles SET status = 'declined'
       WHERE id = $1 AND opponent_id = $2 AND status = 'pending'`,
      [battleId, user_id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles/update-scores - recalculate battle scores (called after journey logged)
router.post('/battles/update-scores', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Get all active battles for this user
    const activeBattles = await query(
      `SELECT * FROM friend_battles
       WHERE status = 'active'
       AND (challenger_id = $1 OR opponent_id = $1)`,
      [user_id]
    );

    for (const battle of activeBattles.rows) {
      // Check if battle has ended
      const now = new Date();
      const endDate = new Date(battle.end_date);

      // Calculate CO2 saved for both users during the battle period
      const challengerScore = await query(
        `SELECT COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) as total
         FROM journeys j JOIN journey_results jr ON jr.journey_id = j.id
         WHERE j.user_id = $1 AND j.date >= $2 AND j.date <= $3 AND j.mode != 'drive'`,
        [battle.challenger_id, battle.start_date, battle.end_date]
      );

      const opponentScore = await query(
        `SELECT COALESCE(SUM(jr.vs_drive_co2_saved_g), 0) as total
         FROM journeys j JOIN journey_results jr ON jr.journey_id = j.id
         WHERE j.user_id = $1 AND j.date >= $2 AND j.date <= $3 AND j.mode != 'drive'`,
        [battle.opponent_id, battle.start_date, battle.end_date]
      );

      const cScore = parseFloat(challengerScore.rows[0].total);
      const oScore = parseFloat(opponentScore.rows[0].total);

      if (now > endDate) {
        // Battle ended — determine winner
        const winnerId = cScore > oScore ? battle.challenger_id :
                         oScore > cScore ? battle.opponent_id : null;
        await query(
          `UPDATE friend_battles
           SET challenger_co2_saved = $1, opponent_co2_saved = $2, status = 'completed', winner_id = $3
           WHERE id = $4`,
          [cScore, oScore, winnerId, battle.id]
        );
      } else {
        // Battle still active — update scores
        await query(
          `UPDATE friend_battles SET challenger_co2_saved = $1, opponent_co2_saved = $2 WHERE id = $3`,
          [cScore, oScore, battle.id]
        );
      }
    }

    res.json({ updated: activeBattles.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/search-users?q=... - search for users to challenge
router.get('/battles/search-users', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const currentUserId = req.query.user_id;
    if (!q || q.length < 2) return res.json([]);

    const result = await query(
      `SELECT id, name, avatar_color FROM users
       WHERE LOWER(name) LIKE LOWER($1) AND id != $2
       LIMIT 10`,
      [`%${q}%`, currentUserId || 0]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
