import webpush from 'web-push';
import { NotificationPayload } from './types.js';
import { PushSubscriptionService } from './push-subscriptions.js';

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:support@mira.ai', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function sendPush(userId: string, payload: NotificationPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw new Error('VAPID not configured');
  const sub = await PushSubscriptionService.getByUserId(userId);
  if (!sub) throw new Error(`No push subscription for user ${userId}`);
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
    },
    JSON.stringify(payload)
  );
}