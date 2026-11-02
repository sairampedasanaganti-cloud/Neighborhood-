/**
 * Client-side Firebase Cloud Messaging (FCM) service.
 * Handles Web Push token registration, permission requesting,
 * and foreground notification receipt.
 */
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase';
import { VAPID_KEY } from '../config';
import api from './api';

let messagingInstance = null;

/**
 * Check if the browser environment supports FCM Web Push.
 */
export async function isPushNotificationSupported() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch (e) {
    return false;
  }
}

/**
 * Get or initialize Firebase Messaging instance.
 */
export async function getFcmMessaging() {
  const supported = await isPushNotificationSupported();
  if (!supported) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

/**
 * Request notification permission and retrieve FCM Web Push token.
 * Stores token in backend against the authenticated user and in localStorage.
 */
export async function requestFcmPermissionAndToken() {
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) {
      console.warn('[FCM] Push notifications are not supported in this browser.');
      return { success: false, reason: 'unsupported' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    // Register service worker explicitly for background messages
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('[FCM] Service worker registration note:', swErr.message);
    }

    const messaging = await getFcmMessaging();
    if (!messaging) {
      return { success: false, reason: 'messaging_init_failed' };
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      localStorage.setItem('nl_fcm_token', currentToken);
      // Send token to backend to store against authenticated user
      try {
        await api.post('/users/fcm-token', {
          token: currentToken,
          deviceType: 'web',
        });
        console.log('[FCM] Token stored securely in backend.');
      } catch (saveErr) {
        console.warn('[FCM] Token sync to backend note:', saveErr.message);
      }
      return { success: true, token: currentToken };
    } else {
      console.warn('[FCM] No registration token available. Request permission again.');
      return { success: false, reason: 'no_token' };
    }
  } catch (err) {
    console.error('[FCM] Error retrieving push notification token:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Set up foreground message listener.
 * Invokes callback when a push notification is received while the tab is active.
 */
export async function setupForegroundListener(onMessageCallback) {
  try {
    const messaging = await getFcmMessaging();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground push notification received:', payload);
      if (typeof onMessageCallback === 'function') {
        onMessageCallback(payload);
      }
    });
  } catch (err) {
    console.warn('[FCM] Failed to set up foreground message listener:', err.message);
    return () => {};
  }
}

/**
 * Remove stored FCM token (on logout or when user opts out).
 */
export async function removeFcmToken() {
  try {
    const token = localStorage.getItem('nl_fcm_token');
    if (token) {
      try {
        await api.delete('/users/fcm-token', { data: { token } });
      } catch (e) {}
      localStorage.removeItem('nl_fcm_token');
    }
  } catch (err) {
    console.warn('[FCM] Error removing FCM token:', err.message);
  }
}
