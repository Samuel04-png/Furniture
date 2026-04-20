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

export function subscribeMergedCollections<T extends { id: string }>(
  sources: Array<{
    key: string;
    path: string;
    constraints?: QueryConstraint[];
    priority?: number;
    map: (item: DocumentData) => T | undefined;
  }>,
  onData: (items: T[]) => void,
  onError?: (error: FirestoreError) => void,
  sort?: (left: T, right: T) => number,
): Unsubscribe {
  const snapshots = new Map<string, T[]>();

  const emit = () => {
    const merged = new Map<string, { item: T; priority: number }>();
    const orderedSources = sources
      .slice()
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

    for (const source of orderedSources) {
      const items = snapshots.get(source.key) ?? [];
      const priority = source.priority ?? 0;
      for (const item of items) {
        if (!merged.has(item.id)) {
          merged.set(item.id, { item, priority });
        }
      }
    }

    const items = Array.from(merged.values()).map((entry) => entry.item);
    if (sort) {
      items.sort(sort);
    }
    onData(items);
  };

  const unsubscribes = sources.map((source) =>
    subscribeCollection<DocumentData>(
      source.path,
      source.constraints ?? [],
      (items) => {
        snapshots.set(
          source.key,
          items
            .map((item) => source.map(item))
            .filter((entry): entry is T => Boolean(entry)),
        );
        emit();
      },
      onError,
    ),
  );

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}

export async function fetchDocument<T extends DocumentData>(path: string, id: string) {
  const snapshot = await getDoc(doc(db, path, id));
  if (!snapshot.exists()) {
    return undefined;
  }
  return normalizeDocument<T>(snapshot.id, snapshot.data());
}

export async function fetchFirstDocument<T extends DocumentData>(
  candidates: Array<{ path: string; id: string; map?: (item: DocumentData) => T }>,
) {
  for (const candidate of candidates) {
    const snapshot = await getDoc(doc(db, candidate.path, candidate.id));
    if (!snapshot.exists()) {
      continue;
    }
    const normalized = normalizeDocument<T>(snapshot.id, snapshot.data());
    return candidate.map ? candidate.map(normalized) : normalized;
  }
  return undefined;
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

export function subscribeMergedDocument<T>(
  sources: Array<{
    key: string;
    path: string;
    id: string;
    priority?: number;
    map?: (item: DocumentData) => T;
  }>,
  onData: (item: T | undefined) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  const snapshots = new Map<string, T | undefined>();

  const emit = () => {
    const winner = sources
      .slice()
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
      .map((source) => snapshots.get(source.key))
      .find(Boolean);
    onData(winner);
  };

  const unsubscribes = sources.map((source) =>
    subscribeDocument<DocumentData>(
      source.path,
      source.id,
      (item) => {
        snapshots.set(
          source.key,
          item ? (source.map ? source.map(item) : (item as T)) : undefined,
        );
        emit();
      },
      onError,
    ),
  );

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
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
