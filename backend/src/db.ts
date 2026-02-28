import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://core29:core29pass@localhost:5432/sustainability',
});

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}
