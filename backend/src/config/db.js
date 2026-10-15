import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

/**
 * Connects to MongoDB. When MONGO_URI is not provided (local development only),
 * an in-memory MongoDB instance is started so the API runs with zero setup.
 * @returns {Promise<{ inMemory: boolean }>}
 */
export async function connectDB() {
  let uri = env.mongoUri;

  if (!uri) {
    if (env.isProduction) {
      throw new Error('MONGO_URI must be set in production');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('retain');
    console.warn('[db] MONGO_URI not set - using an in-memory MongoDB (data is lost on restart)');
  }

  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  return { inMemory: Boolean(memoryServer) };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
