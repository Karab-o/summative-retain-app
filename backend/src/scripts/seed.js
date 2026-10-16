/**
 * Seeds the database configured by MONGO_URI with demo accounts, categories,
 * budgets and sample expenses.
 *
 *   npm run seed         # add demo data (keeps existing data)
 *   npm run seed:reset   # wipe everything first, then seed
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { ensureEnvAdmin, seedDemoData } from '../services/seedService.js';

if (!env.mongoUri) {
  console.error('MONGO_URI is not set. Add it to backend/.env before seeding.');
  process.exit(1);
}

try {
  await connectDB();
  await seedDemoData({ reset: process.argv.includes('--reset') });
  await ensureEnvAdmin();
} catch (err) {
  console.error('[seed] Failed:', err);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
