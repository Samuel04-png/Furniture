import { httpsCallable } from 'firebase/functions';
import { where } from 'firebase/firestore';
import type { NotificationRecord, TeamRole } from '../../../types';
import { functions } from '../../firebase';
import { normalizeRole } from '../constants';
import { subscribeCollection } from '../firestore';

interface NotificationReadPayload {
  notificationId: string;
}

export function subscribeNotifications(
  role: TeamRole,
  onData: (notifications: NotificationRecord[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<NotificationRecord>(
    'notifications',
    [where('targetRoles', 'array-contains', normalizeRole(role))],
    (notifications) =>
      onData(
        notifications.sort((left, right) => {
          const leftTime = left.triggeredAt ? Date.parse(left.triggeredAt) : 0;
          const rightTime = right.triggeredAt ? Date.parse(right.triggeredAt) : 0;
          return rightTime - leftTime;
        }),
      ),
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
