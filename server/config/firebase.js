/**
 * Firebase Admin SDK initialization.
 * Used ONLY on the backend to verify ID tokens sent by the React client.
 * Never expose these credentials to the frontend.
 */
require('dotenv').config();
const admin = require('firebase-admin');

function initFirebase() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[Firebase] Admin credentials missing in .env — auth middleware will reject all requests ' +
      'until FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set.'
    );
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  console.log('[Firebase] Admin SDK initialized.');
  return admin;
}

module.exports = initFirebase();
