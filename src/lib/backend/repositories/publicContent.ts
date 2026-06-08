import { orderBy, where } from 'firebase/firestore';
import type {
  CompanySettings,
  Material,
  PortfolioProject,
  Product,
  SampleRoom,
  TeamMember,
  Testimonial,
} from '../../../types';
import { asset } from '../../../config/site';
import { emptyCompanySettings } from '../constants';
import type { UserIdentity } from '../firestore';
import {
  createDocument,
  fetchDocument,
  removeDocument,
  subscribeCollection,
  subscribeMergedCollections,
  subscribeMergedDocument,
  upsertDocument,
} from '../firestore';
import { normalizeProductRecord } from '../models/products';
import { normalizeTeamMemberRecord } from '../models/team';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function sortByUpdatedThenName<T extends { updatedAt?: string; name?: string; title?: string }>({
  left,
  right,
}: {
  left: T;
  right: T;
}) {
  const leftUpdated = left.updatedAt ? Date.parse(left.updatedAt) : 0;
  const rightUpdated = right.updatedAt ? Date.parse(right.updatedAt) : 0;
  if (rightUpdated !== leftUpdated) {
    return rightUpdated - leftUpdated;
  }
  return (left.name ?? left.title ?? '').localeCompare(right.name ?? right.title ?? '');
}

function isProductPublished(product: Product) {
  const hasExplicitPublishFlag =
    typeof product.publishedToWebsite === 'boolean' ||
    typeof product.website?.isPublished === 'boolean';

  return (
    product.publishedToWebsite === true ||
    (product.website?.isPublished === true &&
      (product.website.visibility ?? 'public') === 'public') ||
    (!hasExplicitPublishFlag && product.status === 'Live')
  );
}

const publicMaterialProfiles: Record<
  string,
  Pick<
    Material,
    | 'name'
    | 'description'
    | 'character'
    | 'bestFor'
    | 'availableFinishes'
    | 'tone'
    | 'accentTone'
  > & { sortOrder: number }
> = {
  mukwa: {
    name: 'Mukwa',
    description:
      'Mukwa carries the golden warmth and quiet movement that anchors Tailored Manor pieces in a room without feeling overly formal.',
    character:
      'Warm-grained, calm, and naturally suited to statement furniture with visible timber character.',
    bestFor: ['Dining tables', 'Beds', 'Boardroom tables'],
    availableFinishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    tone: '#8c6643',
    accentTone: '#b58a57',
    sortOrder: 10,
    fallbackGrainImage: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (1).jpg',
    ),
  },
  rosewood: {
    name: 'Rosewood',
    description:
      'Rosewood brings a richer, deeper expression that works well when a room needs stronger contrast and more formal presence.',
    character:
      'Dense, luxurious, and ideal for pieces that need darker tonal depth and a more executive feel.',
    bestFor: ['Executive desks', 'Media consoles', 'Dining pieces'],
    availableFinishes: ['Matt', 'Semi Gloss', 'High Gloss'],
    tone: '#6f4a35',
    accentTone: '#9d6a4f',
    sortOrder: 20,
    fallbackGrainImage: asset(
      'full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (1).jpg',
    ),
  },
  teak: {
    name: 'Teak',
    description:
      'Teak is chosen for its resilience, balanced tone, and versatility across both indoor and outdoor applications.',
    character:
      'Stable, resilient, and naturally composed with a finish response that suits tailored everyday use.',
    bestFor: ['Outdoor furniture', 'Benches', 'High-traffic pieces'],
    availableFinishes: ['Matt', 'Outdoor Oil', 'Medium Gloss'],
    tone: '#8d6f4c',
    accentTone: '#b79568',
    sortOrder: 30,
    fallbackGrainImage: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
    ),
  },
  mahogany: {
    name: 'Mahogany',
    description:
      'Mahogany offers a smoother, more formal surface with elegant depth that reads especially well in bedrooms and refined joinery.',
    character:
      'Refined, balanced, and well suited to tailored bedroom and storage pieces with a softer luxury feel.',
    bestFor: ['Beds', 'Nightstands', 'Wardrobes'],
    availableFinishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    tone: '#7b5240',
    accentTone: '#ab7762',
    sortOrder: 40,
    fallbackGrainImage: asset(
      'full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (2).jpg',
    ),
  },
};

function resolveMaterialId(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('mukwa')) return 'mukwa';
  if (normalized.includes('rosewood')) return 'rosewood';
  if (normalized.includes('teak')) return 'teak';
  if (normalized.includes('mahogany')) return 'mahogany';
  return '';
}

function buildMaterialFromProfile(
  materialId: string,
  patch: Partial<Material> & Record<string, unknown> = {},
) {
  const profile = publicMaterialProfiles[materialId];
  if (!profile) {
    return undefined;
  }

  return normalizeMaterialRecord(materialId, {
    ...patch,
    name: asString(patch.name, profile.name),
    description: asString(patch.description, profile.description),
    character: asString(patch.character, profile.character),
    bestFor: asStringArray(patch.bestFor).length ? asStringArray(patch.bestFor) : profile.bestFor,
    availableFinishes:
      asStringArray(patch.availableFinishes).length
        ? asStringArray(patch.availableFinishes)
        : profile.availableFinishes,
    grainImage: asString(patch.grainImage, profile.fallbackGrainImage),
    tone: asString(patch.tone, profile.tone),
    accentTone: asString(patch.accentTone, profile.accentTone),
    sortOrder:
      typeof patch.sortOrder === 'number' ? patch.sortOrder : profile.sortOrder,
  });
}

function normalizeInventoryMaterialRecord(
  rawId: string,
  raw: Record<string, unknown>,
  imageByMaterialId: Map<string, string>,
) {
  const materialId = resolveMaterialId(raw.materialId ?? raw.name ?? raw.sku);
  const category = asString(raw.category).toLowerCase();
  if (!materialId || (category && category !== 'hardwood')) {
    return undefined;
  }

  const hasPublishFlag =
    typeof raw.publishedToWebsite === 'boolean' ||
    typeof raw.visibleOnSite === 'boolean' ||
    typeof raw.status === 'string';
  // The current inventory material documents do not expose a publish flag yet, so we surface them all for now.
  const publishedToWebsite = hasPublishFlag
    ? raw.publishedToWebsite === true ||
      raw.visibleOnSite === true ||
      asString(raw.status).trim().toLowerCase() === 'live'
    : true;

  if (!publishedToWebsite) {
    return undefined;
  }

  return buildMaterialFromProfile(materialId, {
    id: rawId,
    name: publicMaterialProfiles[materialId]?.name,
    type: asString(raw.type ?? raw.category, 'Hardwood'),
    unit: asString(raw.unit) || undefined,
    quantity: asNumber(raw.onHand ?? raw.quantity),
    reorderPoint: asNumber(raw.reorderPoint ?? raw.reorderLevel),
    supplier: asString(raw.supplier) || undefined,
    costPerUnit:
      typeof raw.costPerUnit === 'number'
        ? raw.costPerUnit
        : typeof raw.costPerUnitZMW === 'number'
          ? raw.costPerUnitZMW
          : undefined,
    origin: asString(raw.origin, asString(raw.supplier, 'Tailored Manor')),
    grainImage: asString(
      raw.grainImage ?? raw.imageUrl,
      publicMaterialProfiles[materialId]?.fallbackGrainImage ||
        imageByMaterialId.get(materialId) ||
        '',
    ),
    grainImagePath: asString(raw.grainImagePath) || null,
    publishedToWebsite,
    visibleOnSite: publishedToWebsite,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: (raw.createdBy as string | null | undefined) ?? null,
    updatedBy: (raw.updatedBy as string | null | undefined) ?? null,
  });
}

function buildPublicMaterials(
  inventoryRecords: Array<Record<string, unknown>>,
  productRecords: Product[],
) {
  const liveProducts = productRecords.filter((product) => isProductPublished(product));
  const imageByMaterialId = new Map<string, string>();

  liveProducts.forEach((product) => {
    product.materials.forEach((materialId) => {
      if (!imageByMaterialId.has(materialId)) {
        imageByMaterialId.set(materialId, product.cardImage || product.heroImage);
      }
    });
  });

  const materialMap = new Map<string, Material>();

  inventoryRecords.forEach((record) => {
    const normalized = normalizeInventoryMaterialRecord(
      asString(record.id),
      record,
      imageByMaterialId,
    );
    if (normalized) {
      materialMap.set(normalized.id, normalized);
    }
  });

  liveProducts.forEach((product) => {
    product.materials.forEach((materialId) => {
      if (!publicMaterialProfiles[materialId]) {
        return;
      }

      const existing = materialMap.get(materialId);
      if (existing) {
        materialMap.set(materialId, {
          ...existing,
          grainImage: existing.grainImage || product.cardImage || product.heroImage,
        });
        return;
      }

      const fallbackMaterial = buildMaterialFromProfile(materialId, {
        id: materialId,
        type: 'Hardwood',
        origin: 'Tailored Manor',
        grainImage:
          publicMaterialProfiles[materialId]?.fallbackGrainImage ||
          product.cardImage ||
          product.heroImage,
        publishedToWebsite: true,
        visibleOnSite: true,
      });

      if (fallbackMaterial) {
        materialMap.set(materialId, fallbackMaterial);
      }
    });
  });

  return Array.from(materialMap.values()).sort(
    (left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999),
  );
}

function normalizeMaterialRecord(
  materialId: string,
  raw: Partial<Material> & { imageUrl?: unknown },
): Material {
  const publishedToWebsite =
    raw.publishedToWebsite === true || raw.visibleOnSite === true;
  const supplier = asString(raw.supplier);
  const materialType = asString(raw.type ?? (raw as Record<string, unknown>).category);
  const quantity = asNumber((raw as Record<string, unknown>).onHand ?? raw.quantity);
  const costPerUnit = typeof raw.costPerUnit === 'number' ? raw.costPerUnit : undefined;

  return {
    id: materialId,
    name: asString(raw.name, 'Untitled material'),
    type: materialType || undefined,
    unit: asString(raw.unit) || undefined,
    quantity,
    reorderPoint: asNumber(raw.reorderPoint),
    supplier: supplier || undefined,
    costPerUnit,
    origin: asString(raw.origin, supplier || 'Tailored Manor'),
    description: asString(
      raw.description,
      supplier || materialType
        ? `${asString(raw.name, 'This material')} is available through Tailored Manor and can be refined with fuller website storytelling inside the admin library.`
        : `${asString(raw.name, 'This material')} is available through Tailored Manor.`,
    ),
    character: asString(raw.character, materialType || 'Material profile pending.'),
    bestFor: asStringArray(raw.bestFor),
    grainImage: asString(raw.grainImage ?? raw.imageUrl),
    grainImagePath: asString(raw.grainImagePath) || null,
    tone: asString(raw.tone, '#8c6643'),
    accentTone: asString(raw.accentTone, '#b58a57'),
    availableFinishes: asStringArray(raw.availableFinishes),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 999,
    publishedToWebsite,
    visibleOnSite: publishedToWebsite,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: (raw.createdBy as string | null | undefined) ?? null,
    updatedBy: (raw.updatedBy as string | null | undefined) ?? null,
  };
}

function normalizePortfolioRecord(
  projectId: string,
  raw: Partial<PortfolioProject>,
): PortfolioProject {
  const publishedToWebsite =
    raw.publishedToWebsite === true || raw.visibleOnSite !== false;

  return {
    id: projectId,
    slug: asString(raw.slug, projectId),
    title: asString(raw.title, 'Untitled project'),
    location: asString(raw.location),
    category: asString(raw.category),
    heroImage: asString(raw.heroImage),
    heroImagePath: asString(raw.heroImagePath) || null,
    gallery: asStringArray(raw.gallery),
    galleryPaths: asStringArray(raw.galleryPaths),
    summary: asString(raw.summary),
    challenge: asString(raw.challenge),
    solution: asString(raw.solution),
    materials: asStringArray(raw.materials),
    metrics: asStringArray(raw.metrics),
    testimonial: asString(raw.testimonial),
    publishedToWebsite,
    visibleOnSite: publishedToWebsite,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 999,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: (raw.createdBy as string | null | undefined) ?? null,
    updatedBy: (raw.updatedBy as string | null | undefined) ?? null,
  };
}

function normalizeCompanySettings(raw?: Partial<CompanySettings>) {
  if (!raw) {
    return emptyCompanySettings;
  }

  return {
    ...emptyCompanySettings,
    ...raw,
    socialHandles: {
      ...emptyCompanySettings.socialHandles,
      ...(raw.socialHandles ?? {}),
    },
    defaultLeadTimes: {
      ...emptyCompanySettings.defaultLeadTimes,
      ...(raw.defaultLeadTimes ?? {}),
    },
    websiteMedia: {
      ...(emptyCompanySettings.websiteMedia ?? {}),
      ...(raw.websiteMedia ?? {}),
    },
    notificationTemplates: raw.notificationTemplates ?? [],
  };
}

function normalizeSampleRoomRecord(roomId: string, raw: Partial<SampleRoom>): SampleRoom {
  return {
    id: roomId,
    name: asString(raw.name, 'Untitled room'),
    image: asString(raw.image),
    imagePath: asString(raw.imagePath) || null,
    spaceType: (raw.spaceType as SampleRoom['spaceType']) ?? 'Living',
    visibleOnSite: raw.visibleOnSite !== false,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 999,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

function normalizeTestimonialRecord(
  testimonialId: string,
  raw: Partial<Testimonial>,
): Testimonial {
  return {
    id: testimonialId,
    quote: asString(raw.quote),
    clientName: asString(raw.clientName, 'Tailored Manor client'),
    location: asString(raw.location),
    image: asString(raw.image),
    imagePath: asString(raw.imagePath) || null,
    visibleOnSite: raw.visibleOnSite !== false,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 999,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

export function subscribePublishedProducts(
  onData: (products: Product[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Product>(
    'publishedProducts',
    [],
    (products) =>
      onData(
        products
          .map((product) => normalizeProductRecord(product.id, product))
          .filter((product) => isProductPublished(product))
          .sort((left, right) => {
            const leftOrder = left.website?.featuredOrder ?? 999;
            const rightOrder = right.website?.featuredOrder ?? 999;
            if (leftOrder !== rightOrder) {
              return leftOrder - rightOrder;
            }
            return sortByUpdatedThenName({ left, right });
          }),
      ),
    (error) => {
      console.error('Failed to subscribe to published products:', error);
      onError?.('Unable to load the published collection right now.');
    },
  );
}

export function subscribeMaterials(
  onData: (materials: Material[]) => void,
  onError?: (message: string) => void,
) {
  let inventoryRecords: Array<Record<string, unknown>> = [];
  let publishedProducts: Product[] = [];

  const emit = () => {
    onData(buildPublicMaterials(inventoryRecords, publishedProducts));
  };

  const unsubscribeInventory = subscribeCollection<Record<string, unknown>>(
    'inventory',
    [where('category', 'in', ['Hardwood', 'hardwood'])],
    (records) => {
      inventoryRecords = records;
      emit();
    },
    (error) => {
      console.error('Failed to subscribe to materials inventory:', error);
      onError?.('Unable to load the material library right now.');
    },
  );

  const unsubscribeProducts = subscribeCollection<Product>(
    'publishedProducts',
    [],
    (products) => {
      publishedProducts = products.map((product) =>
        normalizeProductRecord(product.id, product),
      );
      emit();
    },
    (error) => {
      console.error('Failed to subscribe to product materials:', error);
      onError?.('Unable to load the material library right now.');
    },
  );

  return () => {
    unsubscribeInventory();
    unsubscribeProducts();
  };
}

export function subscribeAdminMaterials(
  onData: (materials: Material[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Material>(
    'inventoryItems',
    [],
    (materials) =>
      onData(
        materials
          .map((material) => normalizeMaterialRecord(material.id, material))
          .sort((left, right) => sortByUpdatedThenName({ left, right })),
      ),
    (error) => {
      console.error('Failed to subscribe to admin materials:', error);
      onError?.('Unable to load the full material library right now.');
    },
  );
}

export function subscribeSampleRooms(
  onData: (rooms: SampleRoom[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<SampleRoom>(
    'sampleRooms',
    [where('visibleOnSite', '==', true)],
    (rooms) =>
      onData(
        rooms
          .map((room) => normalizeSampleRoomRecord(room.id, room))
          .filter((room) => room.visibleOnSite !== false)
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to sample rooms:', error);
      onError?.('Unable to load the sample rooms right now.');
    },
  );
}

export function subscribeAdminSampleRooms(
  onData: (rooms: SampleRoom[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<SampleRoom>(
    'sampleRooms',
    [orderBy('name', 'asc')],
    (rooms) =>
      onData(
        rooms
          .map((room) => normalizeSampleRoomRecord(room.id, room))
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to admin sample rooms:', error);
      onError?.('Unable to load the full sample room library right now.');
    },
  );
}

export function subscribeTestimonials(
  onData: (testimonials: Testimonial[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Testimonial>(
    'testimonials',
    [where('visibleOnSite', '==', true)],
    (testimonials) =>
      onData(
        testimonials
          .map((testimonial) => normalizeTestimonialRecord(testimonial.id, testimonial))
          .filter((testimonial) => testimonial.visibleOnSite !== false)
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to testimonials:', error);
      onError?.('Unable to load testimonials right now.');
    },
  );
}

export function subscribeAdminTestimonials(
  onData: (testimonials: Testimonial[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Testimonial>(
    'testimonials',
    [orderBy('clientName', 'asc')],
    (testimonials) =>
      onData(
        testimonials
          .map((testimonial) => normalizeTestimonialRecord(testimonial.id, testimonial))
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to admin testimonials:', error);
      onError?.('Unable to load the testimonial library right now.');
    },
  );
}

export function subscribePortfolioProjects(
  onData: (projects: PortfolioProject[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<PortfolioProject>(
    'portfolioProjects',
    [],
    (projects) =>
      onData(
        projects
          .map((project) => normalizePortfolioRecord(project.id, project))
          .filter((project) => project.publishedToWebsite === true)
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to portfolio projects:', error);
      onError?.('Unable to load the portfolio right now.');
    },
  );
}

export function subscribeAdminPortfolioProjects(
  onData: (projects: PortfolioProject[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<PortfolioProject>(
    [
      {
        key: 'portfolioProjects',
        path: 'portfolioProjects',
        priority: 1,
        map: (project) => normalizePortfolioRecord(project.id, project),
      },
    ],
    (projects) =>
      onData(projects.sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999))),
    (error) => {
      console.error('Failed to subscribe to admin portfolio projects:', error);
      onError?.('Unable to load the full portfolio library right now.');
    },
  );
}

export function subscribePublicTeamProfiles(
  onData: (profiles: TeamMember[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<TeamMember>(
    'teamProfiles',
    [where('isPublicProfile', '==', true)],
    (profiles) =>
      onData(
        profiles
          .map((profile) => normalizeTeamMemberRecord(profile.id, profile))
          .filter(
            (profile) =>
              profile.active !== false &&
              (profile.publicProfile === true || profile.isPublicProfile === true),
          )
          .sort((left, right) => left.name.localeCompare(right.name)),
      ),
    (error) => {
      console.error('Failed to subscribe to public team profiles:', error);
      onError?.('Unable to load the studio team right now.');
    },
  );
}

export async function updateMaterial(
  materialId: string,
  patch: Partial<Material>,
  user?: UserIdentity | null,
) {
  await upsertDocument<Material>(
    'inventoryItems',
    materialId,
    {
      ...patch,
      visibleOnSite:
        patch.visibleOnSite ?? patch.publishedToWebsite ?? undefined,
    },
    user,
  );
}

export async function createMaterial(material: Material, user?: UserIdentity | null) {
  await createDocument(
    'inventoryItems',
    material.id,
    {
      ...material,
      publishedToWebsite:
        material.publishedToWebsite ?? material.visibleOnSite ?? false,
      visibleOnSite:
        material.visibleOnSite ?? material.publishedToWebsite ?? false,
    },
    user,
  );
}

export async function deleteMaterial(materialId: string) {
  await removeDocument('inventoryItems', materialId);
}

export async function updateSampleRoom(
  roomId: string,
  patch: Partial<SampleRoom>,
  user?: UserIdentity | null,
) {
  await upsertDocument<SampleRoom>('sampleRooms', roomId, patch, user);
}

export async function createSampleRoom(room: SampleRoom, user?: UserIdentity | null) {
  await createDocument('sampleRooms', room.id, room, user);
}

export async function deleteSampleRoom(roomId: string) {
  await removeDocument('sampleRooms', roomId);
}

export async function updateTestimonial(
  testimonialId: string,
  patch: Partial<Testimonial>,
  user?: UserIdentity | null,
) {
  await upsertDocument<Testimonial>('testimonials', testimonialId, patch, user);
}

export async function createTestimonial(
  testimonial: Testimonial,
  user?: UserIdentity | null,
) {
  await createDocument('testimonials', testimonial.id, testimonial, user);
}

export async function deleteTestimonial(testimonialId: string) {
  await removeDocument('testimonials', testimonialId);
}

export async function updatePortfolioProject(
  projectId: string,
  patch: Partial<PortfolioProject>,
  user?: UserIdentity | null,
) {
  await upsertDocument<PortfolioProject>(
    'portfolioProjects',
    projectId,
    {
      ...patch,
      publishedToWebsite:
        patch.publishedToWebsite ?? patch.visibleOnSite ?? undefined,
      visibleOnSite:
        patch.visibleOnSite ?? patch.publishedToWebsite ?? undefined,
    },
    user,
  );
}

export async function createPortfolioProject(
  project: PortfolioProject,
  user?: UserIdentity | null,
) {
  await createDocument(
    'portfolioProjects',
    project.id,
    {
      ...project,
      publishedToWebsite:
        project.publishedToWebsite ?? project.visibleOnSite ?? true,
      visibleOnSite:
        project.visibleOnSite ?? project.publishedToWebsite ?? true,
    },
    user,
  );
}

export async function deletePortfolioProject(projectId: string) {
  await removeDocument('portfolioProjects', projectId);
}

export async function fetchCompanySettings() {
  const settings = await fetchDocument<CompanySettings>('settings', 'companyProfile');
  return normalizeCompanySettings(settings);
}

export function subscribeCompanySettings(
  onData: (settings: CompanySettings) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedDocument<CompanySettings>(
    [
      {
        key: 'settings',
        path: 'settings',
        id: 'companyProfile',
        priority: 1,
        map: (settings) => normalizeCompanySettings(settings as CompanySettings),
      },
    ],
    (company) => {
      onData(company ?? emptyCompanySettings);
    },
    (error) => {
      console.error('Failed to subscribe to company settings:', error);
      onError?.('Unable to load company settings right now.');
    },
  );
}
