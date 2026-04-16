import type { TeamMember } from '../../../types';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { normalizeTeamMemberRecord } from '../models/team';
import type { UserIdentity } from '../firestore';
import { patchDocument, subscribeCollection } from '../firestore';

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  phone: string;
  role: TeamMember['role'];
  isPublicProfile?: boolean;
}

export interface CreateTeamMemberResult {
  uid: string;
  temporaryPassword: string;
}

interface DisableTeamMemberPayload {
  uid: string;
}

export function subscribeTeamMembers(
  onData: (members: TeamMember[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<TeamMember>(
    'users',
    [],
    (users) =>
      onData(
        users
          .map((user) => normalizeTeamMemberRecord(user.id, user))
          .sort((left, right) => {
            const leftUpdated = left.updatedAt ? Date.parse(left.updatedAt) : 0;
            const rightUpdated = right.updatedAt ? Date.parse(right.updatedAt) : 0;
            if (rightUpdated !== leftUpdated) {
              return rightUpdated - leftUpdated;
            }
            return left.name.localeCompare(right.name);
          }),
      ),
    (error) => {
      console.error('Failed to subscribe to team members:', error);
      onError?.('Unable to load team members right now.');
    },
  );
}

export async function createTeamMember(payload: CreateTeamMemberPayload) {
  const callable = httpsCallable<CreateTeamMemberPayload, CreateTeamMemberResult>(
    functions,
    'createTeamMember',
  );
  const result = await callable(payload);
  return result.data;
}

export async function updateTeamMember(
  teamMemberId: string,
  patch: Partial<TeamMember>,
  user?: UserIdentity | null,
) {
  await patchDocument<TeamMember>('users', teamMemberId, patch, user);
}

export async function disableTeamMember(uid: string) {
  const callable = httpsCallable<DisableTeamMemberPayload, { success: boolean }>(
    functions,
    'disableTeamMember',
  );
  const result = await callable({ uid });
  return result.data;
}
