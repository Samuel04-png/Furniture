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
const firebaseCliClientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const firebaseCliClientSecret = 'j9iVZfS8kkCEFUPaAeJV0sAi';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type MoreProdSeed = {
  id: string;
  slug: string;
  name: string;
  category: 'Storage' | 'Beds';
  room: 'Living' | 'Dining' | 'Bedroom';
  style: 'Contemporary' | 'Traditional' | 'Organic' | 'Minimalist';
  overlayKind: 'cabinet' | 'bed';
  summary: string;
  story: string;
  description: string;
  finishes: string[];
  dimensions: { width: number; depth: number; height: number };
  priceFrom: number;
  leadTime: string;
  tags: string[];
  featuredOrder: number;
  files: string[];
};

const productSeeds: MoreProdSeed[] = [
  {
    id: 'product-urban-media-wall',
    slug: 'urban-media-wall',
    name: 'Urban Media Wall',
    category: 'Storage',
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'cabinet',
    summary: 'A floating TV wall composition with shelving, concealed storage, and a clean architectural profile.',
    story: 'Urban Media Wall is designed for living rooms that want visual order, integrated storage, and a stronger feature wall without heavy bulk.',
    description: 'This unit combines open display shelves, low floating cabinetry, and a centred media zone for a sharper modern lounge setup.',
    finishes: ['Matte Charcoal', 'Soft Beige', 'Warm Walnut'],
    dimensions: { width: 320, depth: 42, height: 220 },
    priceFrom: 32500,
    leadTime: '6-8 weeks',
    tags: ['media wall', 'tv console', 'living room', 'joinery', 'storage'],
    featuredOrder: 41,
    files: ['PHOTO-2026-04-17-20-21-25.jpg'],
  },
  {
    id: 'product-minimal-l-kitchen',
    slug: 'minimal-l-kitchen',
    name: 'Minimal L Kitchen',
    category: 'Storage',
    room: 'Dining',
    style: 'Minimalist',
    overlayKind: 'cabinet',
    summary: 'An L-shaped kitchen layout with crisp cabinetry lines, dark counters, and calm modern balance.',
    story: 'Minimal L Kitchen is built for clients who want their kitchen to feel light, tailored, and visually disciplined rather than over-detailed.',
    description: 'The composition keeps upper storage generous while preserving a clean run of worktop and lower cabinetry for everyday use.',
    finishes: ['Soft White', 'Graphite Stone', 'Matte Taupe'],
    dimensions: { width: 360, depth: 60, height: 240 },
    priceFrom: 68500,
    leadTime: '8-10 weeks',
    tags: ['kitchen', 'cabinetry', 'joinery', 'storage', 'minimal'],
    featuredOrder: 42,
    files: ['PHOTO-2026-04-17-20-21-25 (1).jpg'],
  },
  {
    id: 'product-heritage-canopy-bed',
    slug: 'heritage-canopy-bed',
    name: 'Heritage Canopy Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Traditional',
    overlayKind: 'bed',
    summary: 'A warm timber canopy bed with a structured frame and a quieter, hotel-inspired presence.',
    story: 'Heritage Canopy Bed is made for bedrooms that want depth, warmth, and a tailored sense of enclosure without feeling overly heavy.',
    description: 'The open canopy frame gives the room vertical presence while the timber headboard keeps the visual language grounded and classic.',
    finishes: ['Natural Walnut', 'Warm Oak', 'Medium Gloss Timber'],
    dimensions: { width: 200, depth: 220, height: 230 },
    priceFrom: 29800,
    leadTime: '6-8 weeks',
    tags: ['bed', 'canopy bed', 'bedroom', 'timber', 'statement'],
    featuredOrder: 43,
    files: ['PHOTO-2026-04-17-20-21-26 (1).jpg'],
  },
  {
    id: 'product-tailored-panel-bed',
    slug: 'tailored-panel-bed',
    name: 'Tailored Panel Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Traditional',
    overlayKind: 'bed',
    summary: 'A softly upholstered panel bed that reads plush, refined, and quietly luxurious.',
    story: 'Tailored Panel Bed is intended for bedrooms that want comfort and visual softness without losing a polished silhouette.',
    description: 'The padded vertical headboard brings depth and comfort, making this bed ideal for layered bedding and a more hotel-like finish.',
    finishes: ['Chocolate Leather', 'Taupe Linen', 'Matte Walnut'],
    dimensions: { width: 190, depth: 215, height: 150 },
    priceFrom: 26400,
    leadTime: '6-8 weeks',
    tags: ['bed', 'upholstered bed', 'bedroom', 'luxury', 'panel headboard'],
    featuredOrder: 44,
    files: ['PHOTO-2026-04-17-20-21-26.jpg'],
  },
  {
    id: 'product-cloud-cot-bed',
    slug: 'cloud-cot-bed',
    name: 'Cloud Cot Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Organic',
    overlayKind: 'bed',
    summary: 'A low nursery cot bed with rounded timber edges and a softer, calmer silhouette.',
    story: 'Cloud Cot Bed is designed for nurseries that want warmth and simplicity, with a shape that feels gentle and handcrafted.',
    description: 'The lower profile and slatted sides make it practical for daily use while keeping the visual language soft and uncluttered.',
    finishes: ['Natural Timber', 'Clear Matt', 'Warm Honey'],
    dimensions: { width: 145, depth: 80, height: 92 },
    priceFrom: 9800,
    leadTime: '4-6 weeks',
    tags: ['cot', 'crib', 'nursery', 'kids', 'bed'],
    featuredOrder: 45,
    files: ['PHOTO-2026-04-17-20-21-26 (2).jpg'],
  },
  {
    id: 'product-scandi-spindle-crib',
    slug: 'scandi-spindle-crib',
    name: 'Scandi Spindle Crib',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Minimalist',
    overlayKind: 'bed',
    summary: 'A crisp white spindle crib with a clean nursery look and a compact footprint.',
    story: 'Scandi Spindle Crib fits nurseries that lean lighter and cleaner, with a gentle profile that still feels crafted.',
    description: 'Its slim slatted sides and minimal frame keep the nursery airy while giving enough visual character to stand on its own.',
    finishes: ['Pure White', 'Soft Ivory', 'Natural Birch'],
    dimensions: { width: 135, depth: 78, height: 100 },
    priceFrom: 9200,
    leadTime: '4-6 weeks',
    tags: ['crib', 'nursery', 'kids', 'white crib', 'bed'],
    featuredOrder: 46,
    files: ['PHOTO-2026-04-17-20-21-27.jpg'],
  },
  {
    id: 'product-house-frame-kids-bed',
    slug: 'house-frame-kids-bed',
    name: 'House Frame Kids Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Contemporary',
    overlayKind: 'bed',
    summary: 'A playful house-frame bed that brings colour and personality into a child’s room.',
    story: 'House Frame Kids Bed is made for bedrooms that want the bed itself to feel imaginative, sculptural, and memorable.',
    description: 'The pitched roof frame turns the bed into a room feature while still keeping the structure clean and easy to style.',
    finishes: ['Powder Pink', 'Cloud White', 'Soft Grey Upholstery'],
    dimensions: { width: 110, depth: 205, height: 185 },
    priceFrom: 13800,
    leadTime: '5-7 weeks',
    tags: ['kids bed', 'house bed', 'bedroom', 'pink bed', 'nursery'],
    featuredOrder: 47,
    files: ['PHOTO-2026-04-17-20-21-27 (1).jpg'],
  },
  {
    id: 'product-loft-study-bed',
    slug: 'loft-study-bed',
    name: 'Loft Study Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Contemporary',
    overlayKind: 'bed',
    summary: 'A compact loft bed concept for children’s rooms that need extra function in a smaller footprint.',
    story: 'Loft Study Bed is ideal when the brief is to save floor space while still creating a room that feels made for a child rather than improvised.',
    description: 'The raised bed platform creates room underneath for flexible use, making it a practical option for tighter rooms and evolving layouts.',
    finishes: ['Pink', 'White', 'Soft Grey'],
    dimensions: { width: 105, depth: 200, height: 165 },
    priceFrom: 15400,
    leadTime: '5-7 weeks',
    tags: ['kids bed', 'loft bed', 'bedroom', 'bunk style', 'space saving'],
    featuredOrder: 48,
    files: ['PHOTO-2026-04-17-20-21-27 (2).jpg'],
  },
  {
    id: 'product-hardwood-panel-door',
    slug: 'hardwood-panel-door',
    name: 'Hardwood Panel Door',
    category: 'Storage',
    room: 'Living',
    style: 'Traditional',
    overlayKind: 'cabinet',
    summary: 'A rich hardwood panel door with deeper moulding lines and a classic joinery feel.',
    story: 'Hardwood Panel Door is for projects that want the entrance or internal transition to feel crafted and substantial, not generic.',
    description: 'The panel detailing and timber grain make this a strong fit for higher-end residential and hospitality joinery work.',
    finishes: ['Rich Walnut', 'Mahogany Tone', 'Satin Timber Seal'],
    dimensions: { width: 90, depth: 5, height: 210 },
    priceFrom: 11800,
    leadTime: '4-6 weeks',
    tags: ['door', 'joinery', 'hardwood', 'panel door', 'timber'],
    featuredOrder: 49,
    files: ['PHOTO-2026-04-17-20-21-28 (1).jpg'],
  },
];

async function readAccessToken() {
  try {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      tokens?: { refresh_token?: string };
    };
    const refreshToken = config.tokens?.refresh_token?.trim();

    if (!refreshToken) {
      throw new Error('No refresh token was found in the Firebase CLI config.');
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: firebaseCliClientId,
        client_secret: firebaseCliClientSecret,
        grant_type: 'refresh_token',
        scope: [
          'https://www.googleapis.com/auth/cloud-platform',
          'https://www.googleapis.com/auth/firebase',
          'https://www.googleapis.com/auth/userinfo.email',
          'openid',
        ].join(' '),
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      access_token?: string;
    };
    const token = payload.access_token?.trim();

    if (!token) {
      throw new Error('Token refresh response did not include an access token.');
    }

    return token;
  } catch (error) {
    throw new Error(
      `Unable to mint a Firebase access token from the saved CLI refresh token. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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

async function fetchCollection(token: string, collectionPath: string) {
  const response = await fetch(`${firestoreBaseUrl}/${collectionPath}?pageSize=200`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${collectionPath}: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    documents?: FirestoreDocument[];
  };

  return (payload.documents || []).map((document) => ({
    id: document.name.split('/').pop() || '',
    ...Object.fromEntries(
      Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
    ),
  }));
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

async function main() {
  const token = await readAccessToken();
  const now = new Date().toISOString();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  const sourceDirectory = path.join(repoRoot, 'assets', 'pictures', 'moreprod');
  const existingProducts = await fetchCollection(token, 'products');
  const existingPublishedProducts = await fetchCollection(token, 'publishedProducts');
  const existingStorageFiles = await listStorageFiles(token, 'products/');

  const referencedFiles = new Set(productSeeds.flatMap((seed) => seed.files));
  const folderEntries = await fs.readdir(sourceDirectory);
  const ignoredFiles = folderEntries.filter((entry) => !referencedFiles.has(entry));

  if (ignoredFiles.length) {
    console.log('Ignoring duplicate or unmapped files:');
    ignoredFiles.forEach((file) => console.log(` - ${file}`));
  }

  for (const seed of productSeeds) {
    const existingProduct = existingProducts.find((record) => record.id === seed.id || record.slug === seed.slug);
    const existingWebsite = asRecord(existingProduct?.website);
    const uploadedImages: string[] = [];

    for (const [index, filename] of seed.files.entries()) {
      const objectName = `products/${sanitizeSegment(seed.id)}/gallery/${index + 1}-${sanitizeSegment(filename)}`;
      const localPath = path.join(sourceDirectory, filename);
      const imageUrl = existingStorageFiles.includes(objectName)
        ? getDownloadUrl(objectName)
        : await uploadStorageFile(token, objectName, localPath);
      uploadedImages.push(imageUrl);
    }

    const heroImage = uploadedImages[0] || asString(existingProduct?.heroImage);
    const cardImage = uploadedImages[1] || heroImage;
    const gallery = Array.from(
      new Set([
        heroImage,
        cardImage,
        ...uploadedImages,
        ...asStringArray(existingProduct?.gallery),
      ].filter(Boolean)),
    );

    const payload = {
      ...(existingProduct || {}),
      id: seed.id,
      slug: seed.slug,
      name: seed.name,
      category: seed.category,
      room: seed.room,
      style: seed.style,
      status: 'Live',
      materials: asStringArray(existingProduct?.materials).length ? asStringArray(existingProduct?.materials) : ['mukwa', 'rosewood', 'teak'],
      finishes: seed.finishes,
      heroImage,
      cardImage,
      imageUrl: heroImage,
      gallery,
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
        publishedBy: 'publish-moreprod-products-script',
      },
      createdAt: asString(existingProduct?.createdAt, now),
      updatedAt: now,
      createdBy: asString(existingProduct?.createdBy, 'publish-moreprod-products-script'),
      updatedBy: 'publish-moreprod-products-script',
    };

    const publishedPayload = {
      ...(existingPublishedProducts.find((record) => record.id === seed.id) || {}),
      ...payload,
    };

    await overwriteDocument(token, `products/${seed.id}`, payload);
    await overwriteDocument(token, `publishedProducts/${seed.id}`, publishedPayload);
    console.log(`Published ${seed.name} with ${uploadedImages.length} image(s).`);
  }

  const storageFiles = await listStorageFiles(token, 'products/');
  console.log(`Storage files now in products/: ${storageFiles.length}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
