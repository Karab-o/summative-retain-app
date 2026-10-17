import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { ensureCategories } from './services/categoryService.js';
import { ensureEnvAdmin, seedDemoData } from './services/seedService.js';

async function start() {
  const { inMemory } = await connectDB();

  // Make sure the database always has the required baseline data.
  await ensureCategories();
  await ensureEnvAdmin();
  if ((inMemory || env.seedDemoData) && (await User.countDocuments()) <= 1) {
    await seedDemoData();
  }

  const server = createApp().listen(env.port, () => {
    console.log(`[server] Retain API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
