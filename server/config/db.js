/**
 * MongoDB connection setup using Mongoose.
 * Supports:
 * 1. Offline Mode (USE_OFFLINE_DB=true):
 *    - Instant local connection (zero internet required, immune to campus Wi-Fi / SSL blocks).
 *    - Automatically checks for local MongoDB server (mongodb://127.0.0.1:27017/neighborlink).
 *    - Falls back to built-in MongoMemoryServer (zero install required).
 *    - Auto-seeds complete demo data and accounts on launch.
 * 2. Cloud Mode (USE_OFFLINE_DB=false):
 *    - Connects to MongoDB Atlas with fast timeout.
 *    - Gracefully and seamlessly falls back to offline local database if Atlas is unreachable or TLS fails.
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
  // Option A: Check if standard local MongoDB is running on port 27017
  const localDefaultUri = 'mongodb://127.0.0.1:27017/neighborlink';
  try {
    console.log('[DB] Checking for local MongoDB service on port 27017...');
    await mongoose.connect(localDefaultUri, {
      serverSelectionTimeoutMS: 1200,
    });
    console.log(`[DB] ✓ Connected to local MongoDB: ${localDefaultUri}`);
    await seedIfEmpty();
    return;
  } catch (localErr) {
    // Port 27017 not running, fallback to MongoMemoryServer
  }

  // Option B: High-speed in-memory MongoDB (zero install required)
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
  const useOffline = process.env.USE_OFFLINE_DB === 'true';
  const uri = process.env.MONGODB_URI;

  mongoose.set('strictQuery', true);

  // If user explicitly configured offline mode, or no Atlas URI provided
  if (useOffline || !uri) {
    console.log('[DB] 🔌 Running in OFFLINE mode (bypassing cloud Atlas & campus network restrictions)...');
    await startLocalDatabase();
    return;
  }

  // Cloud Atlas connection attempt
  try {
    console.log('[DB] Attempting connection to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // fast timeout to prevent app hanging
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
    });
    console.log(`[DB] ✓ Connected to MongoDB Atlas: ${mongoose.connection.host}`);
    await seedIfEmpty();
    return;
  } catch (err) {
    console.warn(`[DB] ⚠️ MongoDB Atlas connection error: ${err.message}`);
    console.warn('[DB] 💡 Cause: Public IP not whitelisted in Atlas, or campus firewall blocked TLS handshake.');
    console.warn('[DB] 🚀 Switching to offline local database so app works instantly...');

    // Disconnect any failed/dangling connection before local connect
    try {
      await mongoose.disconnect();
    } catch (e) {}

    await startLocalDatabase();
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
}

module.exports = connectDB;

