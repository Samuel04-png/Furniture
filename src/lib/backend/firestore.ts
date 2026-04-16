import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
  type FirestoreError,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserIdentity {
  uid: string;
  email: string | null;
}

export function collectionRef<T extends DocumentData>(path: string) {
  return collection(db, path) as CollectionReference<T>;
}

export function documentRef<T extends DocumentData>(path: string, id: string) {
  return doc(db, path, id) as DocumentReference<T>;
}

export function subscribeCollection<T extends DocumentData>(
  path: string,
  constraints: QueryConstraint[],
  onData: (items: T[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  const base = collectionRef<T>(path);
  const snapshotQuery = constraints.length ? query(base, ...constraints) : base;
  return onSnapshot(
    snapshotQuery,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => normalizeDocument<T>(docSnap.id, docSnap.data())));
    },
    onError,
  );
}

export async function fetchDocument<T extends DocumentData>(path: string, id: string) {
  const snapshot = await getDoc(doc(db, path, id));
  if (!snapshot.exists()) {
    return undefined;
  }
  return normalizeDocument<T>(snapshot.id, snapshot.data());
}

export function subscribeDocument<T extends DocumentData>(
  path: string,
  id: string,
  onData: (item: T | undefined) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, path, id),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(undefined);
        return;
      }

      onData(normalizeDocument<T>(snapshot.id, snapshot.data()));
    },
    onError,
  );
}

export async function createDocument<T extends DocumentData>(
  path: string,
  id: string,
  data: T,
  user?: UserIdentity | null,
) {
  await setDoc(doc(db, path, id), withCreateAudit(data, user), { merge: false });
}

export async function upsertDocument<T extends DocumentData>(
  path: string,
  id: string,
  data: Partial<T>,
  user?: UserIdentity | null,
) {
  await setDoc(doc(db, path, id), withUpdateAudit(data, user), { merge: true });
}

export async function patchDocument<T extends DocumentData>(
  path: string,
  id: string,
  patch: Partial<T>,
  user?: UserIdentity | null,
) {
  await updateDoc(doc(db, path, id), withUpdateAudit(patch, user) as DocumentData);
}

export async function removeDocument(path: string, id: string) {
  await deleteDoc(doc(db, path, id));
}

export function normalizeDocument<T extends DocumentData>(id: string, raw: DocumentData) {
  const normalized = normalizeValue(raw) as T;
  return { id, ...normalized };
}

export function normalizeValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

export function withCreateAudit<T extends DocumentData>(data: T, user?: UserIdentity | null) {
  return stripUndefined({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid ?? null,
    updatedBy: user?.uid ?? null,
  });
}

export function withUpdateAudit<T extends DocumentData>(data: Partial<T>, user?: UserIdentity | null) {
  return stripUndefined({
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid ?? null,
  });
}

export function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export const descendingByUpdatedAt = [orderBy('updatedAt', 'desc')];
export const descendingByCreatedAt = [orderBy('createdAt', 'desc')];
