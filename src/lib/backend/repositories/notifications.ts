import { httpsCallable } from 'firebase/functions';
import { orderBy } from 'firebase/firestore';
import type { NotificationRecord } from '../../../types';
import { functions } from '../../firebase';
import { subscribeCollection } from '../firestore';

interface NotificationReadPayload {
  notificationId: string;
}

export function subscribeNotifications(
  onData: (notifications: NotificationRecord[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<NotificationRecord>(
    'notifications',
    [orderBy('triggeredAt', 'desc')],
    onData,
    (error) => {
      console.error('Failed to subscribe to notifications:', error);
      onError?.('Unable to load notifications right now.');
    },
  );
}

export async function markNotificationRead(notificationId: string) {
  const callable = httpsCallable<NotificationReadPayload, { success: boolean }>(
    functions,
    'markNotificationRead',
  );
  const result = await callable({ notificationId });
  return result.data;
}

export async function markAllNotificationsRead() {
  const callable = httpsCallable<void, { success: boolean; updatedCount: number }>(
    functions,
    'markAllNotificationsRead',
  );
  const result = await callable();
  return result.data;
}
