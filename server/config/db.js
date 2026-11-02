/**
 * MongoDB connection setup using Mongoose.
 * Supports:
 * 1. Cloud Mode (Vercel / Production / Atlas):
 *    - Reuses existing connection across serverless invocations.
 *    - Connects cleanly to MongoDB Atlas.
 * 2. Offline Mode (Local development only):
 *    - Falls back to local/in-memory Mongo if running locally without Atlas.
 */
const mongoose = require('mongoose');

let memoryServer = null;

async function seedIfEmpty() {
  try {
    const User = require('../models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[DB] Database is empty. Pre-seeding demo accounts and community requests...');
      const { seedData } = require('../seed/seed');
      await seedData();
      console.log('[DB] ✓ Pre-seeded demo accounts and data successfully.');
    }
  } catch (seedErr) {
    console.warn('[DB] Auto-seed check note:', seedErr.message);
  }
}

async function startLocalDatabase() {
  const localDefaultUri = 'mongodb://127.0.0.1:27017/neighborlink';
  try {
    console.log('[DB] Checking for local MongoDB service on port 27017...');
    await mongoose.connect(localDefaultUri, {
      serverSelectionTimeoutMS: 1500,
    });
    console.log(`[DB] ✓ Connected to local MongoDB: ${localDefaultUri}`);
    await seedIfEmpty();
    return;
  } catch (localErr) {
    // Port 27017 not running, fallback to MongoMemoryServer
  }

  try {
    console.log('[DB] Starting built-in high-speed local Mongo instance (offline mode)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const localUri = memoryServer.getUri() + 'neighborlink';

    await mongoose.connect(localUri);
    console.log(`[DB] ✓ Offline local database active at: ${localUri}`);
    await seedIfEmpty();
  } catch (memErr) {
    console.error('[DB] Failed to start local Mongo instance:', memErr.message);
    throw memErr;
  }
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const isVercel = Boolean(process.env.VERCEL);
  const useOffline = process.env.USE_OFFLINE_DB === 'true';
  const uri = process.env.MONGODB_URI;

  mongoose.set('strictQuery', true);

  // In production / Vercel, offline in-memory server is not supported
  if (isVercel || process.env.NODE_ENV === 'production') {
    if (!uri) {
      throw new Error('[DB] MONGODB_URI environment variable is missing in Vercel settings.');
    }

    console.log('[DB] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`[DB] ✓ Connected to MongoDB Atlas: ${mongoose.connection.host}`);
    await seedIfEmpty();
    return;
  }

  // Local development logic
  if (useOffline || !uri) {
    console.log('[DB] 🔌 Running in OFFLINE mode...');
    await startLocalDatabase();
    return;
  }

  try {
    console.log('[DB] Attempting connection to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
    });
    console.log(`[DB] ✓ Connected to MongoDB Atlas: ${mongoose.connection.host}`);
    await seedIfEmpty();
  } catch (err) {
    console.warn(`[DB] ⚠️ MongoDB Atlas connection error: ${err.message}`);
    console.warn('[DB] 🚀 Switching to offline local database for development...');
    try {
      await mongoose.disconnect();
    } catch (e) {}
    await startLocalDatabase();
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

module.exports = connectDB;