const connectDB = require('../server/config/db');

let isConnected = false;

// Wrap the Express app for Vercel Serverless
module.exports = async (req, res) => {
  // Connect to MongoDB once (cached across warm invocations)
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  const app = require('../server/server');
  return app(req, res);
};
