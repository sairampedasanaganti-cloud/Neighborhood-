/**
 * Axios instance that automatically attaches the current Firebase ID token
 * or local session token to every outgoing request.
 */
import axios from 'axios';
import { API_URL } from '../config';
import { auth } from './firebase';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  // If demo session token is active in localStorage, prioritize it
  const localToken = localStorage.getItem('nl_auth_token');
  if (localToken) {
    config.headers.Authorization = `Bearer ${localToken}`;
    return config;
  }

  try {
    if (auth && typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  } catch (err) {
    console.warn('[api] Interceptor token warning:', err.message);
  }

  return config;
});

export default api;
