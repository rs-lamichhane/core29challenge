import { Router, Request, Response } from 'express';
import { query } from '../db';
import crypto from 'crypto';

const router = Router();

// Simple password hashing (demo-grade, not production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if email exists
    const existing = await query('SELECT id FROM accounts WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);

    // Create account
    const accountResult = await query(
      'INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase().trim(), passwordHash]
    );
    const accountId = accountResult.rows[0].id;

    // Generate a random avatar color
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#06B6D4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user profile linked to account
    const userResult = await query(
      'INSERT INTO users (account_id, name, avatar_color) VALUES ($1, $2, $3) RETURNING *',
      [accountId, name.trim(), avatarColor]
    );
    const user = userResult.rows[0];

    // Initialize streak
    await query(
      'INSERT INTO streaks (user_id, current_streak, best_streak) VALUES ($1, 0, 0) ON CONFLICT DO NOTHING',
      [user.id]
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: email.toLowerCase().trim(),
        avatar_color: user.avatar_color,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = hashPassword(password);

    const accountResult = await query(
      'SELECT a.id as account_id, a.email FROM accounts a WHERE a.email = $1 AND a.password_hash = $2',
      [email.toLowerCase().trim(), passwordHash]
    );

    if (accountResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accountId = accountResult.rows[0].account_id;

    // Get user profile
    const userResult = await query(
      'SELECT * FROM users WHERE account_id = $1',
      [accountId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = userResult.rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: accountResult.rows[0].email,
        avatar_color: user.avatar_color,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
