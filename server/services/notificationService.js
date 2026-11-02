/**
 * Central place to create notifications with priority and match explanation support.
 */
const Notification = require('../models/Notification');

async function notify({ user, type, message, title = '', priority = 'NORMAL', matchReasons = [], relatedRequest = null }) {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    priority,
    matchReasons,
    relatedRequest,
  });

  // For individual notifications (e.g. accepted, updates), dispatch push notification
  // Note: GOOD_MATCH and EMERGENCY_ALERT are dispatched in bulk multicast from createRequest
  if (type !== 'GOOD_MATCH' && type !== 'EMERGENCY_ALERT') {
    try {
      const { sendPushToUsers } = require('./fcmService');
      const userId = user?._id || user;
      sendPushToUsers([userId], {
        title: title || 'NeighborLink Notification',
        body: message,
        requestId: relatedRequest,
        type,
        url: relatedRequest ? `/requests/${relatedRequest}` : '/dashboard',
        isEmergency: priority === 'URGENT',
      }).catch((err) => console.warn('[FCM] Notification push note:', err.message));
    } catch (e) {
      console.warn('[FCM] Notification service hook note:', e.message);
    }
  }

  return notification;
}

module.exports = { notify };
