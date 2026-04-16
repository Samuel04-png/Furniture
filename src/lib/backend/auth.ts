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

export interface AuthSession {
  user: User;
  role: ReturnType<typeof normalizeRole>;
}

async function resolveRoleFromUserDocument(user: User) {
  const userRecord = await fetchDocument<{ role?: string }>('users', user.uid);
  return normalizeRole(userRecord?.role ?? null);
}

export async function buildAuthSession(user: User) {
  const token = await getIdTokenResult(user, true);
  const tokenRole = normalizeRole((token.claims.role as string | undefined) ?? null);
  const role = tokenRole === 'Read Only' ? await resolveRoleFromUserDocument(user) : tokenRole;
  return {
    user,
    role,
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
