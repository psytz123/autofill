import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions, InsertPushSubscription } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Generate VAPID keys for Web Push notifications
// In a production environment, these should be stored securely
// You can generate these using: webpush.generateVAPIDKeys()
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLG_OiLl8O-jWMT80V2S5lQvRnm8hCazwHfvXjXR7o9NAxJYhOoPCQy0ZLGqxNMYV31j5PFO_jFqdYcaRVRWlks';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'ZLkqFmxNF-TKKWA1IOx24_5mWb4GfAw6QJCYVZtnbYo';

// Set up the web-push library with our VAPID keys
webpush.setVapidDetails(
  'mailto:support@autofill.com', // Replace with actual contact email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

// Save a new push subscription
export async function saveSubscription(subscription: InsertPushSubscription) {
  try {
    await db.insert(pushSubscriptions).values(subscription);
    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { success: false, error };
  }
}

// Delete a push subscription
export async function deleteSubscription(endpoint: string) {
  try {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return { success: false, error };
  }
}

// Send a push notification
export async function sendNotification(userId: number, payload: { title: string; body: string; icon?: string; data?: any }) {
  try {
    // Get all subscriptions for this user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (!subscriptions.length) {
      return { success: false, error: 'No subscriptions found for this user' };
    }

    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload)
        );
        return { success: true, subscription };
      } catch (error: any) {
        // If subscription is no longer valid (gone), delete it
        if (error.statusCode === 410) {
          await deleteSubscription(subscription.endpoint);
        }
        return { success: false, error, subscription };
      }
    });

    const results = await Promise.all(promises);
    return {
      success: true,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}

// Send notification about order status change
export async function sendOrderStatusNotification(userId: number, orderId: number, status: string) {
  let title, body;
  
  switch (status) {
    case 'IN_PROGRESS':
      title = 'Order In Progress';
      body = `Your fuel order #${orderId} is now being processed.`;
      break;
    case 'COMPLETED':
      title = 'Order Completed';
      body = `Your fuel order #${orderId} has been successfully delivered!`;
      break;
    case 'CANCELLED':
      title = 'Order Cancelled';
      body = `Your fuel order #${orderId} has been cancelled.`;
      break;
    case 'ASSIGNED':
      title = 'Driver Assigned';
      body = `A driver has been assigned to your fuel order #${orderId}.`;
      break;
    case 'ON_THE_WAY':
      title = 'Driver On The Way';
      body = `Your driver is on the way with your fuel order #${orderId}.`;
      break;
    default:
      title = 'Order Update';
      body = `Your fuel order #${orderId} has been updated.`;
  }
  
  return await sendNotification(userId, {
    title,
    body,
    icon: '/logo192.png', // Path to your app icon
    data: {
      orderId,
      status,
      url: `/orders/${orderId}`
    }
  });
}