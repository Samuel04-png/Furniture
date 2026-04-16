import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeProductRecord } from '../src/lib/backend/models/products';
import { normalizeTeamMemberRecord } from '../src/lib/backend/models/team';

const projectId = 'tailored-manor';
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

function readAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    tokens?: { access_token?: string };
  };

  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('Unable to read Firebase CLI access token.');
  }

  return token;
}

function getDocumentId(documentName: string) {
  return documentName.split('/').pop() || documentName;
}

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map((entry) => fromFirestoreValue(entry));
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
    );
  }
  return undefined;
}

function fromFirestoreFields(fields?: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((entry) => stripUndefinedDeep(entry))
      .filter((entry) => entry !== undefined) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefinedDeep(entry)]),
    ) as T;
  }

  return value;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => toFirestoreValue(entry)) } };
  }
  if (value && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toFirestoreValue(entry)]),
        ),
      },
    };
  }
  return { nullValue: null };
}

function sanitizePublishedProduct(
  productId: string,
  raw: ReturnType<typeof normalizeProductRecord>,
  updatedAt: string,
) {
  return {
    id: productId,
    slug: raw.slug,
    name: raw.name,
    category: raw.category,
    room: raw.room,
    style: raw.style,
    status: 'Live',
    materials: raw.materials,
    finishes: raw.finishes,
    upholsterySwatches: raw.upholsterySwatches ?? [],
    heroImage: raw.heroImage,
    cardImage: raw.cardImage || raw.heroImage,
    gallery: raw.gallery,
    summary: raw.summary,
    story: raw.story,
    description: raw.description,
    dimensions: raw.dimensions,
    sizePresets: raw.sizePresets,
    customDimensions: raw.customDimensions,
    priceFrom: raw.priceFrom,
    leadTime: raw.leadTime,
    tags: raw.tags,
    overlayKind: raw.overlayKind,
    silhouetteTone: raw.silhouetteTone ?? null,
    processGallery: raw.processGallery ?? [],
    website: {
      isPublished: true,
      visibility: 'public',
      featured: Boolean(raw.website?.featured),
      featuredOrder: Number(raw.website?.featuredOrder ?? 999),
      storeTitle: raw.website?.storeTitle || raw.name,
      storeSummary: raw.website?.storeSummary || raw.summary,
      storeDescription: raw.website?.storeDescription || raw.description,
      seoTitle: raw.website?.seoTitle || raw.name,
      seoDescription: raw.website?.seoDescription || raw.summary,
      publishedAt: raw.website?.publishedAt ?? updatedAt,
      publishedBy: raw.website?.publishedBy ?? raw.updatedBy ?? 'migration-script',
    },
    updatedAt,
  };
}

async function fetchCollection(token: string, collectionName: string) {
  const response = await fetch(`${firestoreBaseUrl}/${collectionName}?pageSize=200`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${collectionName}: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { documents?: FirestoreDocument[] };
  return payload.documents || [];
}

async function overwriteDocument(
  token: string,
  documentPath: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${firestoreBaseUrl}/${documentPath}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: Object.fromEntries(
        Object.entries(stripUndefinedDeep(payload)).map(([key, value]) => [key, toFirestoreValue(value)]),
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to write ${documentPath}: ${response.status} ${await response.text()}`);
  }
}

async function deleteDocument(token: string, documentPath: string) {
  const response = await fetch(`${firestoreBaseUrl}/${documentPath}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Failed to delete ${documentPath}: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  const token = readAccessToken();
  const now = new Date().toISOString();

  const userDocuments = await fetchCollection(token, 'users');
  let migratedUsers = 0;

  for (const document of userDocuments) {
    const id = getDocumentId(document.name);
    const raw = fromFirestoreFields(document.fields);
    const normalized = normalizeTeamMemberRecord(id, raw as Parameters<typeof normalizeTeamMemberRecord>[1]);
    await overwriteDocument(token, `users/${id}`, {
      ...normalized,
      updatedAt: now,
      updatedBy: 'migration-script',
    });
    migratedUsers += 1;
  }

  const productDocuments = await fetchCollection(token, 'products');
  let migratedProducts = 0;

  for (const document of productDocuments) {
    const id = getDocumentId(document.name);
    const raw = fromFirestoreFields(document.fields);
    const normalized = normalizeProductRecord(id, raw as Parameters<typeof normalizeProductRecord>[1]);
    await overwriteDocument(token, `products/${id}`, {
      ...normalized,
      updatedAt: now,
      updatedBy: 'migration-script',
    });

    const shouldPublish =
      normalized.status === 'Live' &&
      normalized.website?.isPublished !== false &&
      (normalized.website?.visibility ?? 'public') === 'public';

    if (shouldPublish) {
      await overwriteDocument(
        token,
        `publishedProducts/${id}`,
        sanitizePublishedProduct(id, normalized, now),
      );
    } else {
      await deleteDocument(token, `publishedProducts/${id}`);
    }

    migratedProducts += 1;
  }

  console.log(`Migrated ${migratedUsers} user records and ${migratedProducts} product records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
