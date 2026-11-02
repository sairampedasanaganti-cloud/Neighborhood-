/**
 * Server-side Firebase Cloud Messaging (FCM) dispatch service.
 * Dispatches web push notifications to community members.
 * Automatically cleans up stale/invalid device tokens and protects privacy.
 */
const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Send push notifications to a list of user IDs.
 * Automatically removes unregistered or invalid tokens.
 *
 * @param {Array<string|ObjectId>} userIds - Target user IDs
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} [payload.url] - Click action target URL
 * @param {string} [payload.requestId] - Associated request ID
 * @param {string} [payload.type] - Notification type
 * @param {boolean} [payload.isEmergency] - Urgency flag
 */
async function sendPushToUsers(userIds, payload) {
  if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
    return { success: false, reason: 'no_recipients' };
  }

  // Ensure admin messaging is available
  if (!admin.messaging) {
    console.warn('[FCM] Firebase messaging service is not available on admin SDK.');
    return { success: false, reason: 'messaging_unavailable' };
  }

  const ids = Array.isArray(userIds) ? userIds : [userIds];

  try {
    // Find active community members and their registered FCM tokens
    const users = await User.find(
      { _id: { $in: ids }, isSuspended: false },
      'fcmTokens'
    ).lean();

    const tokenMap = []; // { token, userId }
    const tokens = [];

    users.forEach((u) => {
      if (Array.isArray(u.fcmTokens)) {
        u.fcmTokens.forEach((tObj) => {
          if (tObj && tObj.token && !tokens.includes(tObj.token)) {
            tokens.push(tObj.token);
            tokenMap.push({ token: tObj.token, userId: u._id });
          }
        });
      }
    });

    if (tokens.length === 0) {
      // Users don't have registered web push tokens yet
      return { success: true, sentCount: 0, note: 'No active device tokens found for recipients' };
    }

    const title = payload.title || 'NeighborLink Update';
    const body = payload.body || 'You have a new update in your community.';
    const targetUrl = payload.url || (payload.requestId ? `/requests/${payload.requestId}` : '/dashboard');

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        url: targetUrl,
        requestId: payload.requestId ? String(payload.requestId) : '',
        type: payload.type || 'NOTIFICATION',
        isEmergency: payload.isEmergency ? 'true' : 'false',
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: !!payload.isEmergency,
          tag: payload.requestId ? String(payload.requestId) : 'neighborlink-alert',
        },
        fcmOptions: {
          link: targetUrl,
        },
      },
      tokens,
    };

    const batchResponse = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Push sent: ${batchResponse.successCount} succeeded, ${batchResponse.failureCount} failed out of ${tokens.length} devices.`);

    // If any tokens failed due to expiration or invalidation, prune them
    if (batchResponse.failureCount > 0) {
      const tokensToRemove = [];
      batchResponse.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        console.log(`[FCM] Pruning ${tokensToRemove.length} stale/invalid FCM tokens from DB.`);
        await User.updateMany(
          { 'fcmTokens.token': { $in: tokensToRemove } },
          { $pull: { fcmTokens: { token: { $in: tokensToRemove } } } }
        );
      }
    }

    return {
      success: true,
      sentCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
    };
  } catch (err) {
    console.warn('[FCM] Error dispatching multicast push notification:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch push notifications for newly created requests.
 * Explicitly guards against notifying self, leaking private GPS, or duplicate alerts.
 */
async function sendRequestNotificationPush({ request, recipientIds, title, body, isEmergency = false }) {
  if (!request || !recipientIds || recipientIds.length === 0) return;

  const requesterIdStr = String(request.requester?._id || request.requester);

  // Requirement #10: Do not notify the requester about their own request
  const eligibleRecipientIds = recipientIds.filter((id) => String(id) !== requesterIdStr);

  if (eligibleRecipientIds.length === 0) return;

  const sanitizedCommunity = request.community || request.neighborhood || 'your community';
  const requestTitle = request.title || 'Community Request';

  // Requirement #11: Do not expose private information, exact addresses or live GPS
  const pushTitle = title || (isEmergency
    ? `🚨 URGENT EMERGENCY in ${sanitizedCommunity}`
    : `🤝 New ${request.helpCategory || request.category || 'Help'} Request in ${sanitizedCommunity}`);

  const pushBody = body || (isEmergency
    ? `Emergency help needed: "${requestTitle}". Immediate neighbor response requested.`
    : `A neighbor in ${sanitizedCommunity} requested assistance: "${requestTitle}".`);

  await sendPushToUsers(eligibleRecipientIds, {
    title: pushTitle,
    body: pushBody,
    requestId: request._id,
    type: isEmergency ? 'EMERGENCY_ALERT' : 'GOOD_MATCH',
    url: `/requests/${request._id}`,
    isEmergency,
  });
}

module.exports = {
  sendPushToUsers,
  sendRequestNotificationPush,
};
