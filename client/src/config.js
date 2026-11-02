/** Firebase client configuration — reads from Vite env vars, never hardcode secrets here. */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const HERE_MAPS_API_KEY = import.meta.env.VITE_HERE_MAPS_API_KEY || '';
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BOGl_yObi6331wNdWNkRor6LDCoh5eyDfRNroGBTlUaPDKhO1vIFmJZ_gDIAZJ8c8XY7tOIwNz3_qRLQ10wPT5g';


