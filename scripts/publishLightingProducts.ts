import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectId = 'tailored-manor';
const bucket = 'tailored-manor.firebasestorage.app';
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const storageBaseUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o`;
const storageUploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;

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

type LocalFile = {
  fullPath: string;
  relativePath: string;
  name: string;
  searchText: string;
};

type ProductSeed = {
  slug: string;
  name: string;
  category: 'Office' | 'Outdoor';
  room: 'Living' | 'Outdoor';
  style: 'Contemporary' | 'Organic' | 'Minimalist';
  overlayKind: 'desk' | 'outdoor';
  group: 'lighting' | 'stone-lights';
  searchTerms: string[];
  summary: string;
  story: string;
  description: string;
  finishes: string[];
  dimensions: { width: number; depth: number; height: number };
  priceFrom: number;
  leadTime: string;
  tags: string[];
  featuredOrder: number;
};

const productSeeds: ProductSeed[] = [
  {
    slug: 'bubble-chandelier',
    name: 'Bubble Chandelier',
    category: 'Office',
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'desk',
    group: 'lighting',
    searchTerms: ['bubble chandelier', 'chandelier bubble'],
    summary: 'A sculptural glass chandelier that softens a room with floating light and warm depth.',
    story: 'Designed for spaces that need an overhead statement without losing softness, this chandelier layers round glass forms into a calm, luxurious glow.',
    description: 'Bubble Chandelier is suited to lounge and dining settings where the fixture should read as sculpture first and hardware second.',
    finishes: ['Warm Brass', 'Opal Glass', 'Brushed Gold'],
    dimensions: { width: 90, depth: 90, height: 45 },
    priceFrom: 18500,
    leadTime: '4-6 weeks',
    tags: ['lighting', 'light', 'chandelier', 'bubble', 'living room'],
    featuredOrder: 31,
  },
  {
    slug: 'ring-chandelier',
    name: 'Ring Chandelier',
    category: 'Office',
    room: 'Living',
    style: 'Minimalist',
    overlayKind: 'desk',
    group: 'lighting',
    searchTerms: ['ring chandelier', 'halo chandelier'],
    summary: 'A clean circular chandelier for interiors that lean minimal but still want atmosphere.',
    story: 'Ring Chandelier carries a lighter visual footprint while still anchoring the room from above.',
    description: 'This fixture is ideal for rooms that want a contemporary lighting signature with a disciplined silhouette.',
    finishes: ['Matte Black', 'Satin Gold', 'Warm White'],
    dimensions: { width: 80, depth: 80, height: 20 },
    priceFrom: 16800,
    leadTime: '4-6 weeks',
    tags: ['lighting', 'light', 'ring', 'chandelier', 'minimal'],
    featuredOrder: 32,
  },
  {
    slug: 'sculptural-pendant-cluster',
    name: 'Sculptural Pendant Cluster',
    category: 'Office',
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'desk',
    group: 'lighting',
    searchTerms: ['sculptural pendant cluster', 'pendant cluster'],
    summary: 'A layered pendant arrangement that creates a stronger editorial focal point above the room.',
    story: 'This cluster is designed for double-volume corners, dining zones, and lounges that need a more dramatic lighting silhouette.',
    description: 'Sculptural Pendant Cluster works well when a room needs vertical emphasis, rhythm, and warm reflective tone.',
    finishes: ['Smoked Glass', 'Warm Brass', 'Blackened Bronze'],
    dimensions: { width: 70, depth: 70, height: 120 },
    priceFrom: 21400,
    leadTime: '5-7 weeks',
    tags: ['lighting', 'light', 'pendant', 'cluster', 'statement'],
    featuredOrder: 33,
  },
  {
    slug: 'vertical-crystal-sconce',
    name: 'Vertical Crystal Sconce',
    category: 'Office',
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'desk',
    group: 'lighting',
    searchTerms: ['vertical crystal sconce', 'crystal sconce'],
    summary: 'A wall light that introduces sparkle and vertical rhythm without overwhelming the room.',
    story: 'Vertical Crystal Sconce is intended for hallways, bedroom walls, and lounge accents where light should feel refined and intimate.',
    description: 'The vertical format makes it easy to repeat in pairs while keeping the visual language elegant and architectural.',
    finishes: ['Polished Brass', 'Crystal', 'Champagne Gold'],
    dimensions: { width: 18, depth: 12, height: 58 },
    priceFrom: 7600,
    leadTime: '4-6 weeks',
    tags: ['lighting', 'light', 'sconce', 'wall light', 'crystal'],
    featuredOrder: 34,
  },
  {
    slug: 'stone-light-atelier',
    name: 'Stone Light Atelier',
    category: 'Outdoor',
    room: 'Living',
    style: 'Organic',
    overlayKind: 'outdoor',
    group: 'stone-lights',
    searchTerms: ['stone light atelier hero', 'stone light atelier'],
    summary: 'A carved stone pendant that reads tactile, warm, and quietly architectural.',
    story: 'Stone Light Atelier brings natural texture into the lighting story so the room feels grounded rather than overly polished.',
    description: 'This piece works best in spaces that want handcrafted material presence together with a warm, diffuse glow.',
    finishes: ['Natural Stone', 'Brushed Brass', 'Soft Ivory'],
    dimensions: { width: 40, depth: 40, height: 48 },
    priceFrom: 14200,
    leadTime: '5-7 weeks',
    tags: ['stone', 'stone light', 'lighting', 'pendant', 'organic'],
    featuredOrder: 35,
  },
  {
    slug: 'stone-linear-brass-light',
    name: 'Stone Linear Brass Light',
    category: 'Outdoor',
    room: 'Living',
    style: 'Organic',
    overlayKind: 'outdoor',
    group: 'stone-lights',
    searchTerms: ['stone linear brass', 'linear brass stone light'],
    summary: 'A longer stone-and-brass fixture that suits dining spans and elongated feature zones.',
    story: 'Stone Linear Brass Light balances natural mass with a more disciplined linear profile for dining and hospitality-style settings.',
    description: 'The stone element gives the light a crafted feel, while brass detailing sharpens the silhouette.',
    finishes: ['Travertine', 'Brushed Brass', 'Soft White'],
    dimensions: { width: 120, depth: 16, height: 28 },
    priceFrom: 19600,
    leadTime: '5-7 weeks',
    tags: ['stone', 'stone light', 'lighting', 'linear light', 'brass'],
    featuredOrder: 36,
  },
  {
    slug: 'stone-branching-light',
    name: 'Stone Branching Light',
    category: 'Outdoor',
    room: 'Living',
    style: 'Organic',
    overlayKind: 'outdoor',
    group: 'stone-lights',
    searchTerms: ['stone branching profile', 'branching stone light'],
    summary: 'A branching sculptural light for rooms that want an expressive natural centrepiece.',
    story: 'Stone Branching Light introduces more movement and asymmetry while still staying within the calm Tailored Manor palette.',
    description: 'Ideal for lounge corners, stair voids, and statement dining scenes that need a warmer, more tactile signature.',
    finishes: ['Textured Stone', 'Aged Brass', 'Warm White'],
    dimensions: { width: 92, depth: 64, height: 58 },
    priceFrom: 22800,
    leadTime: '6-8 weeks',
    tags: ['stone', 'stone light', 'lighting', 'branching', 'statement'],
    featuredOrder: 37,
  },
  {
    slug: 'stone-triple-glow-light',
    name: 'Stone Triple Glow Light',
    category: 'Outdoor',
    room: 'Living',
    style: 'Organic',
    overlayKind: 'outdoor',
    group: 'stone-lights',
    searchTerms: ['stone triple glow', 'triple glow stone light'],
    summary: 'A clustered stone fixture that layers three warm points of light with a softer handcrafted body.',
    story: 'Stone Triple Glow Light is designed for rooms that need a softer statement than a chandelier but more presence than a single pendant.',
    description: 'This fixture works especially well above side tables, quiet dining settings, and intimate hospitality corners.',
    finishes: ['Natural Stone', 'Warm Brass', 'Milk Glass'],
    dimensions: { width: 58, depth: 58, height: 52 },
    priceFrom: 17400,
    leadTime: '5-7 weeks',
    tags: ['stone', 'stone light', 'lighting', 'triple glow', 'pendant'],
    featuredOrder: 38,
  },
];

function readAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(
    readFileSync(configPath, 'utf8'),
  ) as {
    tokens?: { access_token?: string };
  };

  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('Unable to read Firebase CLI access token.');
  }

  return token;
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

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
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

async function fetchCollection(token: string, collectionPath: string) {
  const documents: Array<Record<string, unknown>> = [];
  let pageToken = '';

  do {
    const url = new URL(`${firestoreBaseUrl}/${collectionPath}`);
    url.searchParams.set('pageSize', '200');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${collectionPath}: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      documents?: FirestoreDocument[];
      nextPageToken?: string;
    };

    for (const document of payload.documents || []) {
      documents.push({
        id: document.name.split('/').pop() || '',
        ...fromFirestoreFields(document.fields),
      });
    }

    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents;
}

async function overwriteDocument(token: string, documentPath: string, payload: Record<string, unknown>) {
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

async function listStorageFiles(token: string, prefix: string) {
  const response = await fetch(`${storageBaseUrl}?prefix=${encodeURIComponent(prefix)}&maxResults=200`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list storage files for ${prefix}: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{ name: string }>;
  };

  return (payload.items || []).map((item) => item.name);
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').toLowerCase();
}

function guessContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  if (ext === '.heif') return 'image/heif';
  return 'application/octet-stream';
}

function getDownloadUrl(objectName: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectName)}?alt=media`;
}

async function uploadStorageFile(token: string, objectName: string, localPath: string) {
  const fileBuffer = await fs.readFile(localPath);
  const response = await fetch(
    `${storageUploadUrl}?uploadType=media&name=${encodeURIComponent(objectName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': guessContentType(localPath),
      },
      body: fileBuffer,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to upload ${localPath}: ${response.status} ${await response.text()}`);
  }

  return getDownloadUrl(objectName);
}

async function collectLocalFiles(relativeDirectories: string[]) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  const files: LocalFile[] = [];

  for (const relativeDirectory of relativeDirectories) {
    const absoluteDirectory = path.join(repoRoot, relativeDirectory);
    await walkDirectory(absoluteDirectory, absoluteDirectory, files);
  }

  return files;
}

async function walkDirectory(root: string, currentDirectory: string, files: LocalFile[]) {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(root, fullPath, files);
      continue;
    }

    const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
    files.push({
      fullPath,
      relativePath,
      name: entry.name,
      searchText: `${relativePath} ${entry.name}`.toLowerCase(),
    });
  }
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 2);
}

function scoreFileMatch(file: LocalFile, seed: ProductSeed) {
  const seedTokens = new Set(tokenize(`${seed.name} ${seed.searchTerms.join(' ')} ${seed.group}`));
  let score = file.searchText.includes(seed.group) ? 3 : 0;

  for (const token of seedTokens) {
    if (file.searchText.includes(token)) {
      score += token.length >= 6 ? 3 : 1;
    }
  }

  if (file.searchText.includes(seed.slug.replace(/-/g, ' '))) {
    score += 6;
  }

  return score;
}

function chooseBestFile(seed: ProductSeed, localFiles: LocalFile[]) {
  const ranked = localFiles
    .map((file) => ({ file, score: scoreFileMatch(file, seed) }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.score ? ranked[0].file : undefined;
}

function matchesLightingKeywords(record: Record<string, unknown>) {
  const tags = Array.isArray(record.tags) ? record.tags.join(' ') : '';
  const haystack = `${record.name || ''} ${record.category || ''} ${tags}`.toLowerCase();
  return ['light', 'lighting', 'stone', 'pendant', 'lamp', 'sconce', 'chandelier']
    .some((keyword) => haystack.includes(keyword));
}

function hasMissingOrPlaceholderImage(record: Record<string, unknown>) {
  const candidate = String(record.imageUrl || record.heroImage || record.cardImage || '').trim().toLowerCase();
  return !candidate || candidate.includes('placeholder') || candidate.includes('dummyimage') || candidate.includes('via.placeholder');
}

async function main() {
  const token = readAccessToken();
  const now = new Date().toISOString();
  const existingProducts = await fetchCollection(token, 'products');
  const existingPublishedProducts = await fetchCollection(token, 'publishedProducts');
  const existingStorageFiles = await listStorageFiles(token, 'products/');
  const localFiles = await collectLocalFiles([
    'public/assets/editorial/lighting',
    'public/assets/editorial/stone-lights',
    'assets/pictures/LIGHTING photos',
    'assets/pictures/stone lights',
  ]);

  console.log(`Storage files found in products/: ${existingStorageFiles.length}`);
  existingStorageFiles.slice(0, 20).forEach((item) => console.log(` - ${item}`));

  const matchingProducts = existingProducts.filter(matchesLightingKeywords);
  console.log(`Matching products already in Firestore: ${matchingProducts.length}`);
  matchingProducts.forEach((record) => {
    if (hasMissingOrPlaceholderImage(record)) {
      console.warn(`[lighting-products] Missing image for ${record.id}: ${record.name || 'Untitled product'}`);
    }
  });

  for (const seed of productSeeds) {
    const matchedFile = chooseBestFile(seed, localFiles);
    if (!matchedFile) {
      throw new Error(`No local image match found for ${seed.name}.`);
    }

    console.log(`Matched ${seed.name} -> ${matchedFile.relativePath}`);

    const existingProduct =
      matchingProducts.find((record) => record.slug === seed.slug) ||
      existingProducts.find((record) => record.slug === seed.slug);
    const existingWebsite = asRecord(existingProduct?.website);
    const productId = String(existingProduct?.id || `product-${seed.slug}`);
    const objectName = `products/${sanitizeSegment(productId)}/hero/${sanitizeSegment(path.basename(matchedFile.name))}`;
    const imageUrl = existingStorageFiles.includes(objectName)
      ? getDownloadUrl(objectName)
      : await uploadStorageFile(token, objectName, matchedFile.fullPath);

    const payload = {
      ...(existingProduct || {}),
      id: productId,
      slug: seed.slug,
      name: seed.name,
      category: seed.category,
      room: seed.room,
      style: seed.style,
      status: 'Live',
      materials: asStringArray(existingProduct?.materials),
      finishes: seed.finishes,
      heroImage: imageUrl,
      cardImage: imageUrl,
      imageUrl,
      gallery: [imageUrl],
      summary: seed.summary,
      story: seed.story,
      description: seed.description,
      dimensions: seed.dimensions,
      sizePresets: [
        {
          id: `${seed.slug}-standard`,
          label: 'Standard',
          dimensions: seed.dimensions,
        },
      ],
      customDimensions: false,
      priceFrom: seed.priceFrom,
      leadTime: seed.leadTime,
      tags: Array.from(new Set([...asStringArray(existingProduct?.tags), ...seed.tags])),
      overlayKind: seed.overlayKind,
      processGallery: Array.isArray(existingProduct?.processGallery) ? existingProduct.processGallery : [],
      publishedToWebsite: true,
      website: {
        isPublished: true,
        visibility: 'public',
        featured: false,
        featuredOrder: seed.featuredOrder,
        storeTitle: seed.name,
        storeSummary: seed.summary,
        storeDescription: seed.description,
        seoTitle: seed.name,
        seoDescription: seed.summary,
        publishedAt: asString(existingWebsite?.publishedAt, now),
        publishedBy: 'publish-lighting-products-script',
      },
      createdAt: asString(existingProduct?.createdAt, now),
      updatedAt: now,
      createdBy: asString(existingProduct?.createdBy, 'publish-lighting-products-script'),
      updatedBy: 'publish-lighting-products-script',
    };

    const publishedPayload = {
      ...(existingPublishedProducts.find((record) => record.id === productId) || {}),
      ...payload,
    };

    await overwriteDocument(token, `products/${productId}`, payload);
    await overwriteDocument(token, `publishedProducts/${productId}`, publishedPayload);
  }

  const nextStorageFiles = await listStorageFiles(token, 'products/');
  console.log(`Storage files now in products/: ${nextStorageFiles.length}`);
  nextStorageFiles.slice(0, 40).forEach((item) => console.log(` - ${item}`));
  console.log(`Published ${productSeeds.length} lighting and stone-light products.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
