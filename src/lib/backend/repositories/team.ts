import { httpsCallable } from 'firebase/functions';
import type { TeamMember } from '../../../types';
import { functions } from '../../firebase';
import { normalizeTeamMemberRecord } from '../models/team';
import type { UserIdentity } from '../firestore';
import { subscribeMergedCollections, upsertDocument } from '../firestore';

export interface CreateTeamMemberPayload {
  displayName: string;
  email: string;
  password: string;
  role: TeamMember['role'];
  avatarUrl?: string;
  publicProfile?: boolean;
}

export interface CreateTeamMemberResult {
  uid: string;
}

interface DisableTeamMemberPayload {
  uid: string;
}

export function subscribeTeamMembers(
  onData: (members: TeamMember[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<TeamMember>(
    [
      {
        key: 'users',
        path: 'users',
        priority: 1,
        map: (member) => normalizeTeamMemberRecord(member.id, member),
      },
    ],
    (users) =>
      onData(
        users.sort((left, right) => {
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
  await upsertDocument<TeamMember>('users', teamMemberId, patch, user);
}

export async function disableTeamMember(uid: string) {
  const callable = httpsCallable<DisableTeamMemberPayload, { success: boolean }>(
    functions,
    'disableTeamMember',
  );
  const result = await callable({ uid });
  return result.data;
}
