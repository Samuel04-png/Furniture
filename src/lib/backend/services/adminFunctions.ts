import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

export interface BackfillPublishedProductsResult {
  totalProducts: number;
  publishedCount: number;
}

export async function backfillPublishedProducts() {
  const callable = httpsCallable<void, BackfillPublishedProductsResult>(
    functions,
    'backfillPublishedProducts',
  );
  const result = await callable();
  return result.data;
}

export async function disableTeamMember(uid: string) {
  const callable = httpsCallable<{ uid: string }, { success: boolean }>(
    functions,
    'disableTeamMember',
  );
  const result = await callable({ uid });
  return result.data;
}
