import { pool } from './db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const dbDir = path.join(__dirname, '../../db');
  const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(dbDir, file), 'utf-8');
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }

  console.log('All migrations complete!');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
