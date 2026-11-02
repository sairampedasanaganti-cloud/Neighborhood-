/**
 * NeighborLink - Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the browser/tab is in the background or closed.
 * Uses the existing Firebase project: neighborlink-f7f2d
 */

// Import Firebase compat libraries inside service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase with the existing project configuration
firebase.initializeApp({
  apiKey: "AIzaSyB2Tu9EZgTcX_ugK5m1jYOUgZzEYUaFxg4",
  authDomain: "neighborlink-f7f2d.firebaseapp.com",
  projectId: "neighborlink-f7f2d",
  storageBucket: "neighborlink-f7f2d.firebasestorage.app",
  messagingSenderId: "851962260143",
  appId: "1:851962260143:web:1975d1f86bcebf1a22c25a"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push notification:', payload);

  const title = payload.notification?.title || payload.data?.title || 'NeighborLink Notification';
  const body = payload.notification?.body || payload.data?.body || 'A new update in your community.';
  const isEmergency = payload.data?.isEmergency === 'true' || payload.data?.type === 'EMERGENCY_ALERT';

  const notificationOptions = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: payload.data?.url || (payload.data?.requestId ? `/requests/${payload.data.requestId}` : '/dashboard'),
      requestId: payload.data?.requestId,
      type: payload.data?.type
    },
    tag: payload.data?.requestId || 'neighborlink-alert',
    renotify: true,
    requireInteraction: isEmergency, // Emergency notifications stay visible until dismissed/clicked
  };

  self.registration.showNotification(title, notificationOptions);
});

// Handle clicking on the notification -> open or focus the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a NeighborLink client window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetPath);
          }
          return;
        }
      }
      // If no window is open, open a new window to the target path
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
