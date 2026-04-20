import type {
  DimensionSet,
  OverlayKind,
  Product,
  ProductCategory,
  ProductStatus,
  RoomCategory,
  StyleMood,
} from '../../../types';
import { slugify } from '../../utils';

interface LegacyProductShape extends Partial<Product> {
  imageUrl?: string | null;
  priceFromZMW?: number;
  leadTimeDays?: number;
  featured?: boolean;
  sku?: string;
  enquiriesCount?: number;
}

const categoryDefaults: Record<
  ProductCategory,
  {
    room: RoomCategory;
    style: StyleMood;
    overlayKind: OverlayKind;
    heroImage: string;
    cardImage: string;
    gallery: string[];
  }
> = {
  Seating: {
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'sofa',
    heroImage:
      '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe.jpg',
    cardImage:
      '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (1).jpg',
    gallery: [
      '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (2).jpg',
      '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (3).jpg',
    ],
  },
  Tables: {
    room: 'Dining',
    style: 'Organic',
    overlayKind: 'table',
    heroImage:
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor.jpg',
    cardImage:
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor (1).jpg',
    gallery: [
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor (2).jpg',
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor (3).jpg',
    ],
  },
  Storage: {
    room: 'Living',
    style: 'Contemporary',
    overlayKind: 'cabinet',
    heroImage:
      '/assets/An intricate design for those looking for something a little more special. 🍽️This dining table .jpg',
    cardImage:
      '/assets/An intricate design for those looking for something a little more special. 🍽️This dining table  (1).jpg',
    gallery: [
      '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (3).jpg',
      '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
    ],
  },
  Beds: {
    room: 'Bedroom',
    style: 'Traditional',
    overlayKind: 'bed',
    heroImage:
      '/assets/bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup.jpg',
    cardImage:
      '/assets/bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (1).jpg',
    gallery: [
      '/assets/bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (2).jpg',
      '/assets/bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (3).jpg',
    ],
  },
  Office: {
    room: 'Office',
    style: 'Minimalist',
    overlayKind: 'desk',
    heroImage:
      '/assets/full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se.jpg',
    cardImage:
      '/assets/full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (1).jpg',
    gallery: [
      '/assets/full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (2).jpg',
      '/assets/full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (3).jpg',
    ],
  },
  Outdoor: {
    room: 'Outdoor',
    style: 'Organic',
    overlayKind: 'outdoor',
    heroImage:
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor (2).jpg',
    cardImage:
      '/assets/dining setup/A beautifully put-together dining setup designed to make every meal feel special, Bringing effor (3).jpg',
    gallery: [
      '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
      '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe.jpg',
    ],
  },
};

const materialIdMap: Record<string, string> = {
  mukwa: 'mukwa',
  rosewood: 'rosewood',
  teak: 'teak',
  mahogany: 'mahogany',
};

function mapLegacyCategory(value?: string | null): ProductCategory {
  const key = String(value || '')
    .trim()
    .toLowerCase();

  if (key === 'tables' || key === 'table' || key === 'dining') return 'Tables';
  if (key === 'storage' || key === 'cabinet' || key === 'cabinetry') return 'Storage';
  if (key === 'beds' || key === 'bed' || key === 'bedroom') return 'Beds';
  if (key === 'office' || key === 'desk') return 'Office';
  if (key === 'outdoor' || key === 'patio') return 'Outdoor';
  return 'Seating';
}

function mapLegacyStatus(value?: string | null): ProductStatus {
  const key = String(value || '')
    .trim()
    .toLowerCase();

  if (key === 'live' || key === 'active' || key === 'published') return 'Live';
  if (key === 'hidden' || key === 'archived' || key === 'inactive') return 'Hidden';
  return 'Draft';
}

function parseMaterialIds(materials: unknown, category: ProductCategory) {
  const normalized = Array.isArray(materials)
    ? materials
        .map((entry) => materialIdMap[String(entry || '').trim().toLowerCase()])
        .filter(Boolean)
    : [];

  if (normalized.length) {
    return Array.from(new Set(normalized));
  }

  if (category === 'Outdoor') return ['teak'];
  if (category === 'Beds') return ['mahogany', 'mukwa'];
  return ['mukwa', 'rosewood', 'teak'];
}

function parseDimensions(value: unknown): DimensionSet {
  if (value && typeof value === 'object' && 'width' in (value as Record<string, unknown>)) {
    const dimensions = value as Partial<DimensionSet>;
    return {
      width: Number(dimensions.width || 220),
      depth: Number(dimensions.depth || 100),
      height: Number(dimensions.height || 78),
    };
  }

  if (typeof value === 'string') {
    const matches = value.match(/(\d+(?:\.\d+)?)/g);
    if (matches && matches.length >= 3) {
      const [width, depth, height] = matches.slice(0, 3).map((entry) => Number(entry));
      const usesMillimetres = width > 1000 || depth > 1000 || height > 1000;
      const divisor = usesMillimetres ? 10 : 1;
      return {
        width: Math.round(width / divisor),
        depth: Math.round(depth / divisor),
        height: Math.round(height / divisor),
      };
    }
  }

  return { width: 220, depth: 100, height: 78 };
}

function buildLeadTime(days?: number, fallback = '6-8 weeks') {
  if (!days || Number.isNaN(days)) return fallback;
  const minWeeks = Math.max(1, Math.floor(days / 7));
  const maxWeeks = Math.max(minWeeks, Math.ceil(days / 7));
  return minWeeks === maxWeeks ? `${maxWeeks} weeks` : `${minWeeks}-${maxWeeks} weeks`;
}

function defaultFinishes(category: ProductCategory) {
  if (category === 'Outdoor') return ['Matt'];
  if (category === 'Office') return ['Matt', 'Medium Gloss'];
  return ['Matt', 'Medium Gloss', 'High Gloss'];
}

function normalizeGallery(raw: LegacyProductShape, category: ProductCategory) {
  const defaults = categoryDefaults[category];
  const gallery = Array.isArray(raw.gallery) ? raw.gallery.filter(Boolean) : [];
  const images = Array.from(
    new Set(
      [raw.heroImage, raw.cardImage, raw.imageUrl, ...gallery, ...defaults.gallery]
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );
  return images.length ? images : [defaults.heroImage, defaults.cardImage];
}

export function normalizeProductRecord(
  productId: string,
  raw: LegacyProductShape,
): Product {
  const category = mapLegacyCategory(raw.category);
  const status = mapLegacyStatus(raw.status);
  const defaults = categoryDefaults[category];
  const dimensions = parseDimensions(raw.dimensions);
  const name = raw.name || 'Untitled product';
  const summary = raw.summary || raw.description || `Tailored Manor ${name.toLowerCase()}.`;
  const gallery = normalizeGallery(raw, category);
  const materials = parseMaterialIds(raw.materials, category);
  const priceFrom = Number(raw.priceFrom ?? raw.priceFromZMW ?? 0);
  const featured = raw.website?.featured ?? raw.featured ?? false;
  const publishedToWebsite =
    raw.publishedToWebsite ??
    raw.website?.isPublished ??
    status === 'Live';

  return {
    id: productId,
    slug: raw.slug || slugify(name || productId),
    name,
    category,
    room: raw.room || defaults.room,
    style: raw.style || defaults.style,
    status,
    materials,
    finishes: Array.isArray(raw.finishes) && raw.finishes.length ? raw.finishes : defaultFinishes(category),
    upholsterySwatches: raw.upholsterySwatches ?? [],
    heroImage: raw.heroImage || raw.imageUrl || gallery[0] || defaults.heroImage,
    cardImage: raw.cardImage || raw.imageUrl || gallery[1] || gallery[0] || defaults.cardImage,
    gallery,
    summary,
    story: raw.story || summary,
    description: raw.description || raw.story || summary,
    dimensions,
    sizePresets:
      Array.isArray(raw.sizePresets) && raw.sizePresets.length
        ? raw.sizePresets
        : [{ id: `${productId}-standard`, label: 'Standard', dimensions }],
    customDimensions: raw.customDimensions ?? true,
    priceFrom,
    leadTime: raw.leadTime || buildLeadTime(raw.leadTimeDays),
    tags:
      Array.isArray(raw.tags) && raw.tags.length
        ? raw.tags
        : [category.toLowerCase(), raw.room || defaults.room, raw.style || defaults.style].map((entry) =>
            String(entry).toLowerCase(),
          ),
    overlayKind: raw.overlayKind || defaults.overlayKind,
    silhouetteTone: raw.silhouetteTone,
    processGallery: Array.isArray(raw.processGallery) ? raw.processGallery : [],
    publishedToWebsite,
    website: {
      isPublished: raw.website?.isPublished ?? publishedToWebsite,
      visibility:
        raw.website?.visibility ??
        (publishedToWebsite ? 'public' : 'internal'),
      featured,
      featuredOrder: raw.website?.featuredOrder ?? (featured ? 1 : 999),
      storeTitle: raw.website?.storeTitle ?? name,
      storeSummary: raw.website?.storeSummary ?? summary,
      storeDescription: raw.website?.storeDescription ?? (raw.description || raw.story || summary),
      seoTitle: raw.website?.seoTitle ?? name,
      seoDescription: raw.website?.seoDescription ?? summary,
      publishedAt: raw.website?.publishedAt ?? (status === 'Live' ? raw.updatedAt || raw.createdAt || null : null),
      publishedBy: raw.website?.publishedBy ?? null,
    },
    internalNotes:
      raw.internalNotes ||
      [raw.sku ? `SKU: ${raw.sku}` : null, raw.enquiriesCount ? `Historic enquiries: ${raw.enquiriesCount}` : null]
        .filter(Boolean)
        .join(' | '),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}
