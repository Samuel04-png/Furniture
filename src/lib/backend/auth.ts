import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { normalizeRole } from './constants';
import { fetchDocument } from './firestore';
import type { TeamStatus } from '../../types';

export interface AuthSession {
  user: User;
  role: ReturnType<typeof normalizeRole>;
  approved: boolean;
  status?: TeamStatus;
}

interface UserAccessRecord {
  role?: string;
  status?: TeamStatus;
}

async function resolveUserAccess(user: User) {
  const userRecord = await fetchDocument<UserAccessRecord>('users', user.uid);
  const status =
    userRecord?.status === 'Disabled'
      ? 'Disabled'
      : userRecord?.status === 'Invited'
        ? 'Invited'
        : userRecord
          ? 'Active'
          : undefined;

  return {
    exists: Boolean(userRecord),
    role: normalizeRole(userRecord?.role ?? null),
    status,
  };
}

export async function buildAuthSession(user: User) {
  const token = await getIdTokenResult(user, true);
  const tokenRole = normalizeRole((token.claims.role as string | undefined) ?? null);
  const approvedClaim = token.claims.approved === true;
  const disabledClaim = token.claims.disabled === true;
  const userAccess = await resolveUserAccess(user);
  const role = userAccess.exists ? userAccess.role : tokenRole;
  const approved = !disabledClaim && (approvedClaim || (userAccess.exists && userAccess.status !== 'Disabled'));

  return {
    user,
    role,
    approved,
    status: userAccess.status,
  } as AuthSession;
}

export function watchAuthSession(callback: (session: AuthSession | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      callback(await buildAuthSession(user));
    } catch (error) {
      console.error('Failed to build auth session:', error);
      callback({
        user,
        role: 'Read Only',
        approved: false,
      });
    }
  });
}

export async function signInAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function refreshAdminSession() {
  if (!auth.currentUser) {
    return null;
  }

  await auth.currentUser.getIdToken(true);
  return buildAuthSession(auth.currentUser);
}

export async function signOutAdmin() {
  return signOut(auth);
}
