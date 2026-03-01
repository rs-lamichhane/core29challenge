import { pool } from './db';
import fs from 'fs';
import path from 'path';

async function seed() {
  const dbDir = path.join(__dirname, '../../db');

  // Run all SQL files in order, skipping metadata files
  const files = fs.readdirSync(dbDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('.'))
    .sort();
  for (const file of files) {
    console.log(`Running: ${file}`);
    await pool.query(fs.readFileSync(path.join(dbDir, file), 'utf-8'));
    console.log(`  ✓ ${file}`);
  }

  console.log('✓ Seed complete!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
